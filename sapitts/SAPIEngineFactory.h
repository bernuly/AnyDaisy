#pragma once
#include "nscore.h"
#define NS_OUTPARAM
#include "nsXPCOM.h"
#include "nsITTSEngineFactory.h"

#define SAPI_FACTORY_CONTRACTID "@benetech.org/tts-engine-factory;1?name=sapi"
#define SAPI_FACTORY_CLASSNAME "SAPIEngineFactory"
#define SAPI_FACTORY_CID {0xb09148fb, 0xec2d, 0x4da3, { 0xb4, 0x44, 0x69, 0x51, 0xbe, 0x75, 0x7a, 0xab }}

#include <windows.h>        // System includes
#include <atlbase.h>		// ATL
#include <sapi.h>           // SAPI includes
#include <sphelper.h>

class SAPIEngineFactory : public nsITTSEngineFactory
{
public:
	NS_DECL_ISUPPORTS
	NS_DECL_NSITTSENGINEFACTORY

	SAPIEngineFactory(void);
	~SAPIEngineFactory(void);
private:
   int priority;
   bool acaLoaded;
};
