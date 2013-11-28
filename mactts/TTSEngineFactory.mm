#include <Cocoa/Cocoa.h>
#include "xpcom-config.h"
#include "TTSEngineFactory.h"
#include "TTSEngine.h"
#undef HAVE_CPP_2BYTE_WCHAR_T
#include "nsStringAPI.h"
#include "nsITTSCallback.h"
#include "nsCOMPtr.h"

TTSEngineFactory::TTSEngineFactory(void) {
	priority = 15;
}

TTSEngineFactory::~TTSEngineFactory(void) {
}

NS_IMETHODIMP TTSEngineFactory::GetName(nsAString & name) {
   name.AssignLiteral("mactts");
   return NS_OK;
}

NS_IMETHODIMP TTSEngineFactory::GetPriority(int *value) {
   *value = priority;
   return NS_OK;
}

NS_IMETHODIMP TTSEngineFactory::SetPriority(int value) {
   priority = value;
   return NS_OK;
}


NS_IMETHODIMP TTSEngineFactory::IsAvailable(int *retval) {
   *retval = PR_TRUE;
   return NS_OK;
}

NS_IMETHODIMP TTSEngineFactory::Initialize(int *retval) {
   *retval = PR_TRUE;
   return NS_OK;
}

NS_IMETHODIMP TTSEngineFactory::CreateEngine(nsITTSEngine **engine) {
   *engine = new TTSEngine();
   // We need to add a reference before we return it as this
   // is expected in XPCOM.  If we don't, the object will get
   // garbage collected.
   (*engine)->AddRef();
   return NS_OK;
}

NS_IMPL_ISUPPORTS1(TTSEngineFactory, nsITTSEngineFactory)

