/*
 *  TTSEngineFactory.h
 *  mactts
 *
 *  Created by Alex Milowski on 3/16/09.
 *  Copyright 2009 Benetech. All rights reserved.
 *
 */
 
 #include "nscore.h"
#define NS_OUTPARAM
 #include "nsXPCOM.h"
 #include "nsITTSEngineFactory.h"
 
#define MACTTS_FACTORY_CONTRACTID "@benetech.org/tts-engine-factory;1?name=mactts"
#define MACTTS_FACTORY_CLASSNAME "MacTTSEngineFactory"
#define MACTTS_FACTORY_CID   {0xe5309b19, 0x6122, 0x4975, { 0xac, 0x90, 0x86, 0x5c, 0x93, 0x7b, 0x97, 0xfc }}
#define MACTTS_FACTORY_IID_STR "e5309b19-6122-4975-ac90-865c937b97fc"

/**
 * This is the factory constructor for creating TTS engine instances.
 */

class TTSEngineFactory : public nsITTSEngineFactory {
public:
    NS_DECL_ISUPPORTS
	NS_DECL_NSITTSENGINEFACTORY
	
	TTSEngineFactory(void);
	virtual ~TTSEngineFactory(void);
private:
    int priority;
};
