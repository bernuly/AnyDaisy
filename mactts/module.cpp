/*
 *  module.cpp
 *  mactts
 *
 *  Created by Alex Milowski on 3/16/09.
 *  Copyright 2009 Benetech. All rights reserved.
 *
 */

#include "xpcom-config.h"
#include "module.h"

/**
 * This is the main entry point for the XPCOM module
 */
NS_GENERIC_FACTORY_CONSTRUCTOR(TTSEngineFactory)

static nsModuleComponentInfo components[] =
{
    {
       MACTTS_FACTORY_CLASSNAME, 
       MACTTS_FACTORY_CID,
       MACTTS_FACTORY_CONTRACTID,
       TTSEngineFactoryConstructor,
    }
};

NS_IMPL_NSGETMODULE("MacTTSEngineFactoryModule", components) 