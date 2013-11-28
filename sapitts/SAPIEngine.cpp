#include "SAPIEngine.h"
#include "nsStringAPI.h"
#include "nsITTSCallback.h"
#include "nsCOMPtr.h"

#include <string>
#include <iostream>
#include <fstream>

#include <windows.h>        // System includes
#include <atlbase.h>		// ATL
#include <sapi.h>           // SAPI includes
#include <sphelper.h>


SAPIEngine::SAPIEngine(void)
{
   CoInitialize(NULL);
   voice.CoCreateInstance( CLSID_SpVoice );
   this->waiter = NULL;

   CComPtr<IEnumSpObjectTokens>   cpEnum;
   CComPtr<ISpObjectToken> cpVoiceToken;

   SpEnumTokens(SPCAT_VOICES, NULL, NULL, &cpEnum);


   ULONG count;
   cpEnum->GetCount(&count);

   //std::wofstream data("c:\\voice-selected.txt");

   LPWSTR id;
   while (count>0) {
      count--;
      cpEnum->Next(1, &cpVoiceToken, NULL);
      cpVoiceToken->GetId(&id);
      std::wstring sid(id);
      size_t pos = sid.find(L"Acapela Multimedia for DON JOHNSTON");
      //data << "Checking: " << sid << " pos=" << pos << std::endl << std::flush;
      if (pos!=std::wstring::npos) {
         //data << "Selecting: " << id << std::endl << std::flush;
         voice->SetVoice(cpVoiceToken);
         cpVoiceToken.Release();
         break;
      }
      cpVoiceToken.Release();
   }

   //voice->GetVoice(&cpVoiceToken);
   //cpVoiceToken->GetId(&id);
   //data << "Voice: " << id << std::endl << std::flush;
   //data.close();
}

SAPIEngine::~SAPIEngine(void)
{
   this->Cancel();
   voice.Release();
   CoUninitialize();
}

NS_IMETHODIMP SAPIEngine::GetName(nsAString & name) {
   name.AssignLiteral("sapi");
   return NS_OK;
}

NS_IMETHODIMP SAPIEngine::IsSpeaking(int *retval) {
   SPVOICESTATUS status;
   voice->GetStatus(&status,NULL);
   *retval = status.dwRunningState==2 ? PR_TRUE : PR_FALSE;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngine::GetMinimumRate(PRInt32 *aMinimumRate)
{
   *aMinimumRate = -10;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngine::GetNormalRate(PRInt32 *aNormalRate)
{
   *aNormalRate = 0;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngine::GetMaximumRate(PRInt32 *aMaximumRate)
{
   *aMaximumRate = 10;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngine::GetRateUnit(nsAString & rateUnit) {
   rateUnit.AssignLiteral("scalar");
   return NS_OK;
}


NS_IMETHODIMP SAPIEngine::GetRate(PRInt32 *rate) {
   long sprate;
   voice->GetRate(&sprate);
   *rate = (PRInt32)sprate;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngine::SetRate(PRInt32 rate) {
   long sprate = rate;
   voice->SetRate(sprate);
   return NS_OK;
}

struct WaitData {
   HANDLE handle;
   HANDLE thread;
   DWORD id;
   nsCOMPtr<nsITTSCallback> callback;
   bool cancelled;
   SAPIEngine * owner;
};

DWORD SpeechWaiter(WaitData *waiter) {
   WaitForSingleObject(waiter->handle,3*60*1000); // 3 minute max
   if (waiter->owner->waiter==((void *)waiter)) {
      waiter->owner->waiter = NULL;
   }
   waiter->callback->OnFinish(waiter->cancelled);
   CloseHandle(waiter->thread);
   delete waiter;
   return 0;
}

NS_IMETHODIMP SAPIEngine::Cancel() {
   WaitData *waiter = (WaitData *)this->waiter;
   if (waiter!=NULL) {
      waiter->cancelled = true;
   }
   voice->Speak( NULL, SPF_PURGEBEFORESPEAK, 0 );
   return NS_OK;
}


NS_IMETHODIMP SAPIEngine::Speak(const nsAString & text,nsITTSCallback *callback) {
   this->Cancel();
   int len = text.Length();
   wchar_t *data = new wchar_t[len+1];
   const wchar_t *current = text.BeginReading();
   for (int i=0; i<len; i++) {
      data[i] = current[i];
   }
   data[len] = NULL;
   voice->Speak( data, SPF_ASYNC|SPF_IS_NOT_XML, 0 );
   if (callback!=NULL) {
      WaitData *waiter = new WaitData();
      waiter->cancelled = false;
      waiter->handle = voice->SpeakCompleteEvent();
      waiter->callback = callback;
      waiter->owner = this;
      waiter->thread = CreateThread(
         NULL,
			NULL,
			(LPTHREAD_START_ROUTINE)SpeechWaiter,
			(LPVOID)waiter,
			NULL,
			&waiter->id
		);
      this->waiter = waiter;
   } else {
      this->waiter = NULL;
   }
   delete [] data;
   return NS_OK;
}



NS_IMPL_ISUPPORTS1(SAPIEngine, nsITTSEngine)