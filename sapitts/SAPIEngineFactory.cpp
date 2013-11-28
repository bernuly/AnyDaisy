#include "SAPIEngineFactory.h"
#include "SAPIEngine.h"
#include "nsStringAPI.h"


#include <string>
#include <iostream>
#include <fstream>


#define _BABTTSDYN_IMPL_
#include "BabTTSBundle.h"
#include "ioBabTts.h"
#include "ifBabTTSDyn.h"
const char* license= "xx";

SAPIEngineFactory::SAPIEngineFactory(void)
{
   priority = 10;

   acaLoaded = false;

   // Acapela voice bootstrapping

   // find the path from the registry
   LPCTSTR gg_UserRootKey = TEXT("SOFTWARE\\DonJohnston\\Acapela TTS Multimedia\\Modules\\BabTTS");

   HKEY hUser;
   long err = ::RegOpenKeyEx(HKEY   vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv_LOCAL_MACHINE, gg_UserRootKey, 0, KEY_ALL_ACCESS, &hUser);

   if (ERROR_SUCCESS != err) {
      return;
   }

   DWORD type;
   TCHAR pathKey[32000];
   DWORD size = 32000 * sizeof (TCHAR);

   err = ::RegQueryValueEx(hUser, _T(""), 0, &type, (BYTE*)pathKey, &size);

   // initialize the DLL loading with the path
   if (BabTtsInitDllEx(pathKey)!=NULL) {

      // set the license
      CTTSBundle ttsbund(CTTSBundle::BUNDLE_BABTTS);
      ttsbund.SetLicense(license);

      // initialize the TTS
      if (!BabTTS_Init()) {
         // no place for the error...
      } else {
         acaLoaded = true;
      }
   }

   /*
   CComPtr<IEnumSpObjectTokens>   cpEnum;

   SpEnumTokens(SPCAT_VOICES, NULL, NULL, &cpEnum);


   ULONG count;
   cpEnum->GetCount(&count);

   while (count>0) {
      count--;
      cpEnum->Next(1, &cpVoiceToken, NULL);
      LPWSTR id;
      cpVoiceToken->GetId(&id);
      std::wstring sid(id);
      if (sid.find_first_of(L"Acapela Multimedia for DON JOHNSTON")!=std::wstring::npos) {
         acaFound = true;
         break;
      }
      cpVoiceToken.Release();
   }
   */
   /*
   std::wofstream data("c:\\voices.txt");
   CComPtr<IEnumSpObjectTokens>   cpEnum;

   SpEnumTokens(SPCAT_VOICES, NULL, NULL, &cpEnum);


   ULONG count;
   cpEnum->GetCount(&count);

   while (count>0) {
      count--;
      CComPtr<ISpObjectToken>        cpVoiceToken;
      cpEnum->Next(1, &cpVoiceToken, NULL);
      ULONG key = 0;
      LPWSTR name;
      LPWSTR id;
      LPWSTR value;
      cpVoiceToken->GetId(&id);
      data << "Token: " << id << std::endl << std::flush;
      while(cpVoiceToken->EnumKeys(key,&name)==S_OK) {
         int status = cpVoiceToken->GetStringValue(name,&value);
         data << name << " = " << std::flush;
         if (value!=NULL) {
            data << value << "'";
         } else {
            data << "NULL";
         }
         data << std::endl << std::flush;
         key++;
      }
      cpVoiceToken.Release();
      data << "End Token" << std::endl << std::flush;
   }

   cpEnum.Release();

   data.close();
   */

}

SAPIEngineFactory::~SAPIEngineFactory(void)
{
   // Uncomment to re-enable acapela
   /*if (acaLoaded) {
      BabTTS_Uninit();
      BabTtsUninitDll();
      ///*
      //if (acaFound) {
      //   cpVoiceToken.Release();
      //}*/
   }*/
}

NS_IMETHODIMP SAPIEngineFactory::GetPriority(int *value) {
   *value = priority;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngineFactory::SetPriority(int value) {
   priority = value;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngineFactory::GetName(nsAString & name) {
   name.AssignLiteral("sapi");
   return NS_OK;
}

NS_IMETHODIMP SAPIEngineFactory::Initialize(int *retval) {
   *retval = PR_TRUE;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngineFactory::IsAvailable(int *retval) {
   *retval = PR_TRUE;
   return NS_OK;
}

NS_IMETHODIMP SAPIEngineFactory::CreateEngine(nsITTSEngine **engine) {
   *engine = new SAPIEngine();
   /*
   if (acaFound) {
      ((SAPIEngine *)engine)->SetVoice(cpVoiceToken);
   }
   */
   (*engine)->AddRef();
   return NS_OK;
}



NS_IMPL_ISUPPORTS1(SAPIEngineFactory, nsITTSEngineFactory)
