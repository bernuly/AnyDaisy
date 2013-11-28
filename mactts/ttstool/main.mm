#include <iostream>
#include <Cocoa/Cocoa.h>
#include "TTSEngineFactory.h"
#include "nsITTSEngineFactory.h"
#include "nsITTSEngine.h"
#include "nsITTSCallback.h"
#undef HAVE_CPP_2BYTE_WCHAR_T
#include "nsStringAPI.h"
#include "nsCOMPtr.h"

class MyCallback : public nsITTSCallback {
public:
    NS_DECL_ISUPPORTS
	NS_DECL_NSITTSCALLBACK
	MyCallback(void);
	virtual ~MyCallback(void);
};

MyCallback::MyCallback(void) {
}

MyCallback::~MyCallback(void) {
}

NS_IMETHODIMP MyCallback::OnFinish() {
   std::cout << "END" << std::endl << std::flush;
   return NS_OK;
}

NS_IMPL_ISUPPORTS1(MyCallback, nsITTSCallback)

int main (int argc, char * const argv[]) {
   NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

	nsITTSEngineFactory *factory = new TTSEngineFactory();
	factory->AddRef();
    int value = PR_TRUE;
	if (factory->IsAvailable(&value)==NS_OK && value==PR_TRUE) {
		if (factory->Initialize(&value)==NS_OK && value==PR_TRUE) {
			for (int i=1; i<argc; i++) {
				nsITTSEngine *engine = NULL;
				if (factory->CreateEngine(&engine)==NS_OK) {
					NS_ConvertUTF8toUTF16 text(argv[i],strlen(argv[i]));
					std::cout << i <<  ": " << argv[i] << " " << std::flush; 
					engine->Speak(text,new MyCallback());
					while (engine->IsSpeaking(&value)==NS_OK && value==PR_TRUE) {
						sleep(1);
						std::cout << "." << std::flush;
					}
					engine->Release();
					std::cout << std::endl << std::flush;
				}
		    }
		}
    }
    factory->Release();
    std::cout << "Done." << std::endl << std::flush;
	sleep(3);
	[pool release];
    return 0;
}
