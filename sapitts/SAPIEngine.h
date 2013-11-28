#pragma once
#include "nscore.h"
#define NS_OUTPARAM
#include "nsXPCOM.h"
#include "nsITTSEngine.h"

#include <windows.h>        // System includes
#include <atlbase.h>		// ATL
#include <sapi.h>           // SAPI includes


class SAPIEngine : public nsITTSEngine
{
public:

	NS_DECL_ISUPPORTS
	NS_DECL_NSITTSENGINE

   SAPIEngine(void);
   ~SAPIEngine(void);
   void * waiter;

private:
   CComPtr<ISpVoice>   voice;
};
