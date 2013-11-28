#include <iostream>
#include <unistd.h>
#include "xpcom-config.h"
#include "TTSEngine.h"
#undef HAVE_CPP_2BYTE_WCHAR_T
#include "nsStringAPI.h"
#include "nsITTSCallback.h"

@implementation Voice 
- (id)init {
    self = [super init];
    if (self) {
       _synth = [[NSSpeechSynthesizer alloc] init]; 
	   // we set ourselves to the delegate so that we
	   // get the "end of speech" notification
       [_synth setDelegate:self];
    }
	callback = NULL;
	currentText = NULL;
    return self;
}
- (void) dealloc {
   [super dealloc];
   [_synth release];
   if (callback!=NULL) {
	  callback->Release();
   }
}
- (id) setCallback: (nsITTSCallback *) _value
{
    if (callback!=NULL) {
	   callback->Release();
    }
	callback = _value;
	if (callback!=NULL) {
		callback->AddRef();
    }
	return self;
}
- (nsITTSCallback *) getCallback {
   return callback;
}
- (void)speechSynthesizer:(NSSpeechSynthesizer *)sender didFinishSpeaking:(BOOL)finishedSpeaking;
{
	if (callback!=NULL) {
		callback->OnFinish(false);
		callback = NULL;
	}
	[currentText release];
	currentText = NULL;
}

- (NSSpeechSynthesizer *)synth {
   return _synth;
}

- (void)speak:(NSString *)text {
   currentText = text;
   [_synth startSpeakingString: text];
}


@end

TTSEngine::TTSEngine(void) {
   voice  = [[Voice alloc] init];
}

TTSEngine::~TTSEngine(void) {
   [voice release];
}

NS_IMETHODIMP TTSEngine::GetName(nsAString & name) {
   name.AssignLiteral("mactts");
   return NS_OK;
}

NS_IMETHODIMP TTSEngine::IsSpeaking(int *retval) {
   *retval = [[voice synth] isSpeaking] ? PR_TRUE : PR_FALSE;
   return NS_OK;
}

NS_IMETHODIMP TTSEngine::GetMinimumRate(PRInt32 *aMinimumRate)
{
   *aMinimumRate = 90;
   return NS_OK;
}

NS_IMETHODIMP TTSEngine::GetNormalRate(PRInt32 *aNormalRate)
{
   *aNormalRate = 180;
   return NS_OK;
}

NS_IMETHODIMP TTSEngine::GetMaximumRate(PRInt32 *aMaximumRate)
{
   *aMaximumRate = 360;
   return NS_OK;
}

NS_IMETHODIMP TTSEngine::GetRateUnit(nsAString & rateUnit) {
   rateUnit.AssignLiteral("wpm");
   return NS_OK;
}


NS_IMETHODIMP TTSEngine::GetRate(PRInt32 *rate) {
   *rate = (PRUint32)[[voice synth] rate];
   return NS_OK;
}

NS_IMETHODIMP TTSEngine::SetRate(PRInt32 rate) {
   [[voice synth] setRate: (double)rate];
   return NS_OK;
}



NS_IMETHODIMP TTSEngine::Cancel() {
   nsITTSCallback * callback = [voice getCallback];
   if (callback!=NULL) {
      callback->AddRef();
   }
   [voice setCallback: NULL];
   [[voice synth] stopSpeaking];
   if (callback) {
      callback->OnFinish(true);
	  callback->Release();
   }   
   return NS_OK;
}

NS_IMETHODIMP TTSEngine::Speak(const nsAString & text,nsITTSCallback *callback) {
   [[voice synth] stopSpeaking];
   
   // we allocate the text because the speech synthesizer wants
   // the text accessible for the duration of the speech
   NSString *s = [[NSString alloc] initWithCharacters:text.BeginReading() length:text.Length()]; 

   // The callback is set from the caller.  This can be null.
   [voice setCallback: callback];

   // Speech is handle asynchronously so this will return immediately   
   [voice speak: s];
   
   return NS_OK;
}

NS_IMPL_ISUPPORTS1(TTSEngine, nsITTSEngine)