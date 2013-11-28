#include "windows.h"
#include "nsIGenericFactory.h"
#include "SAPIEngineFactory.h"

/*
BOOL APIENTRY DllMain(HMODULE hModule, DWORD  ul_reason_for_call, LPVOID lpReserved) {
	return TRUE;
}*/

NS_GENERIC_FACTORY_CONSTRUCTOR(SAPIEngineFactory)

static nsModuleComponentInfo components[] =
{
    {
       SAPI_FACTORY_CLASSNAME, 
       SAPI_FACTORY_CID,
       SAPI_FACTORY_CONTRACTID,
       SAPIEngineFactoryConstructor,
    }
};

NS_IMPL_NSGETMODULE("SAPITTSEngineFactoryModule", components) 