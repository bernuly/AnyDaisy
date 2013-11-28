/*	
	(C) November 2005, Acapela Group SA, Belgium 

    This file and the accompanying libraires/files can
	only be used if you have an signed agreement with Babel Technologies SA.
	Redistribution of source code and .lib files is stricly prohibited.
	The client is responsible for keeping his clientID and password secret.

    The written agreement signed with Acapela Group SA supersedes this
	notice of use.
*/

#ifndef _BABTTSBUNDLE_H_
#define _BABTTSBUNDLE_H_

/* 
   How to use it to bundle a license in a client application:
   1. include this header file
   2. load your license.h into a string
   3. Create an instance of CTTSBundle
   4. Tell the CTTSBundle which string to use as license
   
  Details:
    #include "BabTTSBundle.h"
	LPCSTR lpszLic=
#include "license.h"
;
	//in code
    CTTSBundle	bundle(CTTSBundle::BUNDLE_BABTTS);
	bundle.SetLicense(lpszLic);
*/
#ifndef WIN32
#include <dlfcn.h>
#include <tchar.h>
#endif
#ifdef WIN32
#	define LOADSYMBOL GetProcAddress 
#   define CLOSELIB FreeLibrary			
typedef HMODULE	DYNHANDLE;
#else
#ifndef LOADSYMBOL
#	define LOADSYMBOL dlsym
#endif
#ifndef CLOSELIB 
#   define CLOSELIB dlclose
#endif
typedef void*	DYNHANDLE;
#endif

static DYNHANDLE BabTtsBundleDLL=NULL;
#ifdef WIN32
#	define DECL_PrivBabTTS_SetLicense 95 
#else
#	define DECL_PrivBabTTS_SetLicense "PrivBabTTS_SetLicense"
#endif

#ifndef BABTTS_LIB
#ifdef WIN32
#define BABTTS_LIB _T("acatts.dll")
#elif defined(__APPLE__)
#define BABTTS_LIB "libacatts.dylib"
#else 
#define BABTTS_LIB "libacatts.so"
#endif //WIN32
#else
#pragma message(("BabTTSBundle Using ")BABTTS_LIB)
#endif

typedef int (WINAPI *pPrivBabTTS_SetLicense2)(const char* lpszLic);

class CTTSBundle
{
public:
	typedef enum { BUNDLE_BABTTS =20 } BundleID;
	CTTSBundle(BundleID bundleid=BUNDLE_BABTTS)
	{
		TCHAR szTemp[512];
#ifdef WIN32
		BabTtsBundleDLL=GetModuleHandle(BABTTS_LIB);
		if (BabTtsBundleDLL!=NULL)
		{
			//we found BABTTS_LIB --> get the full name
			if (0==GetModuleFileName(BabTtsBundleDLL,szTemp,512))
			{
				_tcscpy(szTemp,BABTTS_LIB);
			}
		}
		else
		{
			_tcscpy(szTemp,BABTTS_LIB);
		}
#else
		Dl_info infoDylib;
		if (BabTTS_Open!=NULL)
		{
			if(dladdr((void*)BabTTS_Open, &infoDylib))
			{
				strcpy(szTemp, infoDylib.dli_fname);
			}
		}
		else
		{
			if(dladdr("", &infoDylib))
			{
				char *lastseparator;
				strcpy(szTemp, infoDylib.dli_fname);
				lastseparator = strrchr(szTemp, '/');
				szTemp[lastseparator-szTemp+1] = '\0';
				strcat(szTemp, BABTTS_LIB);
			}
			else//last resort
				strcpy(szTemp,BABTTS_LIB);
		}
#endif
		Init(bundleid,szTemp);
	}
	CTTSBundle(BundleID bundleid,LPCTSTR lpszEngine)
	{
		Init(bundleid,lpszEngine);
	}
	~CTTSBundle()
	{
		if (BabTtsBundleDLL)
		{
			CLOSELIB(BabTtsBundleDLL);
			BabTtsBundleDLL=0;
		}
	
	}
	bool Register(unsigned long dwClientKey, unsigned long dwPassword)
	{
		return true;//for backward compatibility only
	}
	bool SetLicense(const char* lpszLicense)
	{
		if (NULL==PrivBabTTS_SetLicense || NULL==lpszLicense)
			return false;
		int ret=PrivBabTTS_SetLicense(lpszLicense);
		if (ret)
			return true;
		else
			return false;
	}
protected:
	pPrivBabTTS_SetLicense2 PrivBabTTS_SetLicense;

	void Init(BundleID bundleid,LPCTSTR lpszEngine)
	{
		PrivBabTTS_SetLicense=NULL;
#ifdef WIN32
		if (BabTtsBundleDLL=LoadLibrary(lpszEngine))
#else 
		if (BabTtsBundleDLL= dlopen(lpszEngine, RTLD_NOW))
#endif	
		{

			PrivBabTTS_SetLicense = (pPrivBabTTS_SetLicense2) LOADSYMBOL(BabTtsBundleDLL,(const char*) DECL_PrivBabTTS_SetLicense);

			if (NULL==PrivBabTTS_SetLicense)
			{
#ifdef WIN32
				::MessageBox(NULL,_T("Incorrect Version of BabTts"),_T("Error"),MB_OK);
#else
				printf("Incorrect Version of BabTts\n");
#endif			
				CLOSELIB(BabTtsBundleDLL);

			}
		}
	}
};
#endif
