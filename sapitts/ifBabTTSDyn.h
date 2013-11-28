/*
* Acapela Group SA 
* TTS Product
*
* 
* Copyright (c) 2005 Acapela Group SA
*
* All rights reserved.
* PERMISSION IS HEREBY DENIED TO USE, COPY, MODIFY, OR DISTRIBUTE THIS
* SOFTWARE OR ITS DOCUMENTATION FOR ANY PURPOSE WITHOUT WRITTEN
* AGREEMENT OR ROYALTY FEES.
*/
/*
 * Description:
 *  How to use this file to dynamically import AcaTts.dll:
 *  1. Make sure that ioBabTTS.h and ifBabTTSDyn.h are in the Include Path of your project
 *  2. In any source needing the functions of the SDK:
 *       #include <windows.h> (or <stdafx.h>)
 *       #include "ioBabTTS.h"
 *  	 #include "ifBabTTSDyn.h"
 *    3. You need to implement the body of the Dynamic loading in EXACTLY ONE source
 *       For this file:
 *  	 #include <windows.h> or  <stdafx.h>
 *       #include "ioBabTTS.h"
 *  	 #define _BABTTSDYN_IMPL_
 *  	 #include "ifBabTTSDyn.h"
 *  	 #undef _BABTTSDYN_IMPL_
 *  
 *    4. Before using any TTS functions you'll need to make sure that the AcaTts.DLL is loaded
 *       and its functions imported: this is accomplished by
 *  	 BabTtsInitDll() if Acatts.dll is in the current directory(or in the search path). 
 *		 or
 *		 BabTtsInitDllEx(const char* lpszPath) where lpszpath is the full (absolute) path of acatts.dll (including the filename)
 *  
 *   5. After you're done with the TTS, unload the library
 *       BabTtsUninitDll()
 *  
 */
#ifndef WINAPI
#define WINAPI
#endif


#ifndef _IFBABTTSDYN_H
#define	_IFBABTTSDYN_H
#ifdef WIN32
#	define LOADSYMBOL GetProcAddress 
#   define CLOSELIB FreeLibrary			
typedef HMODULE	DYNHANDLE;
#   include <tchar.h>
#else //LINUX AND APPLE
#	ifndef HWND
#		define HWND void*
#	endif
#	ifndef HMODULE
#		define HMODULE void* 
#	endif
#	include <dlfcn.h>
#	include <unistd.h>
#	include <stdlib.h>
#	include <string.h>
#	define LOADSYMBOL dlsym 
#   define CLOSELIB dlclose
typedef void*	DYNHANDLE;
#endif

#ifdef __cplusplus
extern "C"
{
#endif //__cplusplus

typedef bool (WINAPI *LP_BabTTS_Init)(void);
typedef bool (WINAPI *LP_BabTTS_Uninit)(void);

//enumerators
typedef	long		(WINAPI *LP_BabTTS_GetNumVoices)(void);
typedef	BabTtsError	(WINAPI *LP_BabTTS_EnumVoices)(unsigned long dwIndex,char szVoice[50]);
typedef	BabTtsError	(WINAPI *LP_BabTTS_GetVoiceInfo)(const char* lpszVoice,BABTTSINFO* lpInfo);
typedef	BabTtsError	(WINAPI *LP_BabTTS_GetInstanceInfo)(LPBABTTS lpObject,BABTTSINFO* lpInfo);
typedef BabTtsError	(WINAPI *LP_BabTTS_GetVoiceLicense)(const char* lpszVoice,BABTTSLICINFO* lpInfo);

//open-close
typedef LPBABTTS 	(WINAPI *LP_BabTTS_Create)(void);
typedef	BabTtsError	(WINAPI *LP_BabTTS_Open)(LPBABTTS lpObject,const char* lpszSpeechFont,unsigned long dwOpenFlag);
typedef	BabTtsError (WINAPI *LP_BabTTS_Close)(LPBABTTS lpObject);

typedef	BabTtsError (WINAPI *LP_BabTTS_SetCallback)(LPBABTTS lpObject,void* lpCallback,unsigned long dwCallbackType);
typedef	BabTtsError (WINAPI *LP_BabTTS_GetCallback)(LPBABTTS lpObject,void** lppCallback,unsigned long* lpdwCallbackType);

typedef	BabTtsError (WINAPI *LP_BabTTS_SetSettings)(LPBABTTS lpObject,BabTtsParam paramtype, unsigned long dwParam);
typedef	BabTtsError (WINAPI *LP_BabTTS_GetSettings)(LPBABTTS lpObject,BabTtsParam paramtype, unsigned long* pdwParam);
typedef BabTtsError (WINAPI *LP_BabTTS_Dialog) (LPBABTTS lpObject,HWND hWnd,BabTtsDlg dlgType);
typedef	BabTtsError (WINAPI *LP_BabTTS_SetFilterPreset) (LPBABTTS lpObject,const char* lpszPreset);
typedef	BabTtsError (WINAPI *LP_BabTTS_GetFilterPreset) (LPBABTTS lpObject,char szPreset[50]);


typedef	BabTtsError (WINAPI *LP_BabTTS_Speak)(LPBABTTS lpObject,const char* lpszText,unsigned long dwSpeakFlag);
typedef	BabTtsError (WINAPI *LP_BabTTS_Write)(LPBABTTS lpObject,const char* lpszText,const char* lpszFileName,unsigned long dwWriteFlag);
typedef	BabTtsError (WINAPI *LP_BabTTS_Reset)(LPBABTTS lpObject);
typedef	BabTtsError (WINAPI *LP_BabTTS_Pause)(LPBABTTS lpObject);
typedef	BabTtsError (WINAPI *LP_BabTTS_Resume)(LPBABTTS lpObject);

typedef	BabTtsError (WINAPI *LP_BabTTS_InsertText)(LPBABTTS lpObject, const char* lpszText,unsigned long dwTextFlag);
typedef	BabTtsError	(WINAPI *LP_BabTTS_ReadBuffer)(LPBABTTS lpObject,void* lpBuffer,unsigned long dwBufSize, unsigned long* lpdwGen);

typedef	BabTtsError (WINAPI *LP_BabTTS_DictLoad)(LPBABTTS lpObject, LPBABTTSDICT* lppDict,const char* lpszFileName);
typedef	long  		(WINAPI *LP_BabTTS_DictGetNumLoaded)(LPBABTTS lpObject);
typedef	long  		(WINAPI *LP_BabTTS_DictGetMax)(LPBABTTS lpObject);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictEnum)(LPBABTTS lpObject, LPBABTTSDICT* lppDict,unsigned long dwIndex);
typedef	long  		(WINAPI *LP_BabTTS_DictIsModified)(LPBABTTS lpObject, LPBABTTSDICT lpDict);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictUnload)(LPBABTTS lpObject, LPBABTTSDICT lpDict);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictUnloadAll)(LPBABTTS lpObject);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictEnable)(LPBABTTS lpObject, LPBABTTSDICT lpDict);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictDisable)(LPBABTTS lpObject, LPBABTTSDICT lpDict);

typedef	BabTtsError (WINAPI *LP_BabTTS_DictSave)(LPBABTTS lpObject, LPBABTTSDICT lpDict,const char* lpszFileName);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictSaveAll)(LPBABTTS lpObject);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictAddWord)(LPBABTTS lpObject, LPBABTTSDICT lpDict,const char* lpszWord,const char* lpszTrans,BabTtsWordType Type);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictRemoveWord)(LPBABTTS lpObject, LPBABTTSDICT lpDict,const char* lpszWord);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictGetWordTrans)(LPBABTTS lpObject, LPBABTTSDICT lpDict,const char* lpszWord, char* lpszTrans, unsigned long* lpdwSize, BabTtsWordType* lpWordType);
typedef	long  		(WINAPI *LP_BabTTS_DictGetNumEntries)(LPBABTTS lpObject, LPBABTTSDICT lpDict);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictGetEntry)(LPBABTTS lpObject, LPBABTTSDICT lpDict, unsigned long dwIndex, char* lpszEntry, unsigned long* lpdwEntrySize);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictGetInfo)(LPBABTTS lpObject, LPBABTTSDICT lpDict,LPBABTTSDICTINFO lpDictinfo);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictGetInfoFromFile)(LPBABTTS lpObject, const char* lpszFileName,LPBABTTSDICTINFO lpDictinfo);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictSetInfo)(LPBABTTS lpObject, LPBABTTSDICT lpDict,BABTTSDICTINFO Dictinfo);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictSetPassword)(LPBABTTS lpObject, LPBABTTSDICT lpDict,const char* lpszStr1,const char* lpszStr2);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictGetDefList)(LPBABTTS lpObject,char* lpszFileList,unsigned long* lpdwSize);
typedef	BabTtsError (WINAPI *LP_BabTTS_DictSetDefList)(LPBABTTS lpObject,const char* lpszFileList);

typedef	BabTtsError (WINAPI *LP_BabTTS_PhoGetMouth)(LPBABTTS lpObject, unsigned long dwPhoneme,BABTTSMOUTH* lpMouth);
typedef	BabTtsError (WINAPI *LP_BabTTS_PhoGetDuration)(LPBABTTS lpObject, unsigned long dwPhoneme,unsigned long* lpdwDuration);
typedef	BabTtsError (WINAPI *LP_BabTTS_PhoGetViseme)(LPBABTTS lpObject, unsigned long dwPhoneme,unsigned long* lpdwViseme);

#ifdef __cplusplus
}
#endif //__cplusplus

#ifdef _BABTTSDYN_IMPL_

	#ifdef _WINUSER_ 
	  #define DYN(x) x=( LP_##x )LOADSYMBOL(hMod,#x); \
	 // if(!x) { if(IDYES==MessageBox(NULL,"Missing export in acatts.dll: " #x "\nAbort ?","BabTtsDyn",MB_YESNO)) PostQuitMessage(1);  return NULL;} 
	#else
	  #define DYN(x) x=( LP_##x )LOADSYMBOL(hMod,#x); 
	#endif

	#define DDECL(x)  LP_##x x=NULL;
	#define DCLEAR(x) x=NULL;
#ifndef BABTTS_LIB
#ifdef WIN32
#define BABTTS_LIB _T("acatts.dll")
#elif defined(__APPLE__)
#define BABTTS_LIB "libacatts.dylib"
#else  
#define BABTTS_LIB "libacatts.so"
#endif //WIN32
#endif //BABTTS_LIB
#else
	#define DDECL(x) extern LP_##x x;
#endif //_BABTTSDYN_IMPL_

DDECL(BabTTS_Init)
DDECL(BabTTS_Uninit)
DDECL(BabTTS_GetNumVoices)
DDECL(BabTTS_EnumVoices)
DDECL(BabTTS_GetVoiceInfo)
DDECL(BabTTS_GetInstanceInfo)
DDECL(BabTTS_GetVoiceLicense)
DDECL(BabTTS_InsertText)
DDECL(BabTTS_ReadBuffer)
DDECL(BabTTS_Create)
DDECL(BabTTS_Open)
DDECL(BabTTS_Close)
DDECL(BabTTS_Speak)
DDECL(BabTTS_Write)
DDECL(BabTTS_Reset)
DDECL(BabTTS_SetCallback)
DDECL(BabTTS_GetCallback)
DDECL(BabTTS_SetSettings)
DDECL(BabTTS_GetSettings)
DDECL(BabTTS_SetFilterPreset)
DDECL(BabTTS_GetFilterPreset)
DDECL(BabTTS_Dialog)
DDECL(BabTTS_Pause)
DDECL(BabTTS_Resume)
DDECL(BabTTS_DictLoad)
DDECL(BabTTS_DictGetNumLoaded)
DDECL(BabTTS_DictGetMax)
DDECL(BabTTS_DictEnum)
DDECL(BabTTS_DictIsModified)
DDECL(BabTTS_DictUnload)
DDECL(BabTTS_DictUnloadAll)
DDECL(BabTTS_DictEnable)
DDECL(BabTTS_DictDisable)
DDECL(BabTTS_DictSave)
DDECL(BabTTS_DictSaveAll)
DDECL(BabTTS_DictAddWord)
DDECL(BabTTS_DictRemoveWord)
DDECL(BabTTS_DictGetWordTrans)
DDECL(BabTTS_DictGetNumEntries)
DDECL(BabTTS_DictGetEntry)
DDECL(BabTTS_DictGetInfo)
DDECL(BabTTS_DictGetInfoFromFile)
DDECL(BabTTS_DictSetInfo)
DDECL(BabTTS_DictSetPassword)
DDECL(BabTTS_DictGetDefList)
DDECL(BabTTS_DictSetDefList)
DDECL(BabTTS_PhoGetMouth)
DDECL(BabTTS_PhoGetDuration)
DDECL(BabTTS_PhoGetViseme)

#ifdef _BABTTSDYN_IMPL_
HMODULE _BABTTSDYN_hMod=NULL;
//#pragma message(_T("Dynamic Load : ")BABTTS_LIB)
void LoadFunctions(HMODULE hMod)
{
	_BABTTSDYN_hMod=hMod;
	DYN(BabTTS_Init)
	DYN(BabTTS_Uninit)
	DYN(BabTTS_GetNumVoices);
	DYN(BabTTS_EnumVoices);
	DYN(BabTTS_GetVoiceInfo);
	DYN(BabTTS_GetInstanceInfo);
	DYN(BabTTS_GetVoiceLicense);
	DYN(BabTTS_InsertText);
	DYN(BabTTS_ReadBuffer);
	DYN(BabTTS_Create);
	DYN(BabTTS_Open);
	DYN(BabTTS_Close);
	DYN(BabTTS_Speak);
	DYN(BabTTS_Write);
	DYN(BabTTS_Reset);
	DYN(BabTTS_SetCallback);
	DYN(BabTTS_GetCallback)
	DYN(BabTTS_SetSettings);
	DYN(BabTTS_GetSettings);
	DYN(BabTTS_SetFilterPreset)
	DYN(BabTTS_GetFilterPreset)
	DYN(BabTTS_Dialog)
	DYN(BabTTS_Pause);
	DYN(BabTTS_Resume);
	DYN(BabTTS_DictLoad);
	DYN(BabTTS_DictGetNumLoaded);
	DYN(BabTTS_DictGetMax);
	DYN(BabTTS_DictEnum);
	DYN(BabTTS_DictIsModified);
	DYN(BabTTS_DictUnload);
	DYN(BabTTS_DictUnloadAll);
	DYN(BabTTS_DictEnable);
	DYN(BabTTS_DictDisable);
	DYN(BabTTS_DictSave);
	DYN(BabTTS_DictSaveAll);
	DYN(BabTTS_DictAddWord);
	DYN(BabTTS_DictRemoveWord);
	DYN(BabTTS_DictGetWordTrans);
	DYN(BabTTS_DictGetNumEntries);
	DYN(BabTTS_DictGetEntry);
	DYN(BabTTS_DictGetInfo);
	DYN(BabTTS_DictGetInfoFromFile);
	DYN(BabTTS_DictSetInfo);
	DYN(BabTTS_DictSetPassword);
	DYN(BabTTS_DictGetDefList);
	DYN(BabTTS_DictSetDefList);
	DYN(BabTTS_PhoGetMouth);
	DYN(BabTTS_PhoGetDuration);
	DYN(BabTTS_PhoGetViseme);
}
HMODULE BabTtsInitDllEx(LPCTSTR lpsz)
{

	HMODULE hMod=NULL;
#ifdef WIN32
	hMod=LoadLibrary(lpsz);
	if(!hMod||hMod<(HMODULE)32)
		return hMod;
#else 
	
	hMod= dlopen(lpsz, RTLD_NOW);
	if(!hMod) 
		return NULL;
	setenv("ACATTSDYNLIBPATH",lpsz,1);
#endif
	LoadFunctions(hMod);
	return hMod;

}
HMODULE BabTtsInitDll()
{
	HMODULE hMod=NULL;
	TCHAR szTemp[512];
#ifdef WIN32
	hMod=GetModuleHandle(BABTTS_LIB);
	if (hMod!=NULL)
	{
		//we found BABTTS_LIB --> get the full name
		if (0==GetModuleFileName(hMod,szTemp,512))
		{
			_tcscpy(szTemp,BABTTS_LIB);
		}
	}
	else
	{
		_tcscpy(szTemp,BABTTS_LIB);
	}
	hMod=LoadLibrary(szTemp);
	if(!hMod||hMod<(HMODULE)32)
		return hMod;
#else //LINUX and __APPLE__
	if(NULL == getenv("ACATTSDYNLIBPATH"))
	{
		Dl_info infoDylib;
		if(dladdr("", &infoDylib))
		{
			char *lastseparator;
			strcpy(szTemp, infoDylib.dli_fname);
			lastseparator = strrchr(szTemp, '/');
			szTemp[lastseparator-szTemp+1] = '\0';
			strcat(szTemp, BABTTS_LIB);
		}
		else
			return NULL;
		//libacatts.dylib not already loaded => surely in current working directory
		//Retrieve the current working directory and concatenate the library name
		/*if(getcwd(szTemp, 512))
		{
			if(szTemp[strlen(szTemp)] != '/')
				strcat(szTemp, "/");
			strcat(szTemp, BABTTS_LIB);  
		}
		else
			return NULL;
		*/
	}
	else
		strcpy(szTemp, getenv("ACATTSDYNLIBPATH"));

	hMod= dlopen(szTemp, RTLD_NOW);
	if(!hMod) 
		return NULL;
	setenv("ACATTSDYNLIBPATH",szTemp,1);
#endif
	LoadFunctions(hMod);
	return hMod;
}

long BabTtsUninitDll()
{
	CLOSELIB(_BABTTSDYN_hMod);
	_BABTTSDYN_hMod=NULL;
	DCLEAR(BabTTS_GetNumVoices);
	DCLEAR(BabTTS_EnumVoices);
	DCLEAR(BabTTS_GetVoiceInfo);
	DCLEAR(BabTTS_GetInstanceInfo);
	DCLEAR(BabTTS_GetVoiceLicense);
	DCLEAR(BabTTS_InsertText);
	DCLEAR(BabTTS_ReadBuffer);
	DCLEAR(BabTTS_Create);
	DCLEAR(BabTTS_Open);
	DCLEAR(BabTTS_Close);
	DCLEAR(BabTTS_Speak);
	DCLEAR(BabTTS_Write);
	DCLEAR(BabTTS_Reset);
	DCLEAR(BabTTS_SetCallback);
	DCLEAR(BabTTS_GetCallback)
	DCLEAR(BabTTS_SetSettings);
	DCLEAR(BabTTS_GetSettings);
	DCLEAR(BabTTS_SetFilterPreset)
	DCLEAR(BabTTS_GetFilterPreset)
	DCLEAR(BabTTS_Dialog)
	DCLEAR(BabTTS_Pause);
	DCLEAR(BabTTS_Resume);
	DCLEAR(BabTTS_DictLoad);
	DCLEAR(BabTTS_DictGetNumLoaded);
	DCLEAR(BabTTS_DictGetMax);
	DCLEAR(BabTTS_DictEnum);
	DCLEAR(BabTTS_DictIsModified);
	DCLEAR(BabTTS_DictUnload);
	DCLEAR(BabTTS_DictUnloadAll);
	DCLEAR(BabTTS_DictEnable);
	DCLEAR(BabTTS_DictSave);
	DCLEAR(BabTTS_DictSaveAll);
	DCLEAR(BabTTS_DictAddWord);
	DCLEAR(BabTTS_DictRemoveWord);
	DCLEAR(BabTTS_DictGetWordTrans);
	DCLEAR(BabTTS_DictGetNumEntries);
	DCLEAR(BabTTS_DictGetEntry);
	DCLEAR(BabTTS_DictGetInfo);
	DCLEAR(BabTTS_DictGetInfoFromFile);
	DCLEAR(BabTTS_DictSetInfo);
	DCLEAR(BabTTS_DictSetPassword);
	DCLEAR(BabTTS_DictGetDefList);
	DCLEAR(BabTTS_DictSetDefList);
	DCLEAR(BabTTS_PhoGetMouth);
	DCLEAR(BabTTS_PhoGetDuration);
	DCLEAR(BabTTS_PhoGetViseme);
	return 0;
}
#else
	extern HMODULE BabTtsInitDll();
	extern long BabTtsUninitDll();
	extern HMODULE BabTtsInitDllEx(LPCTSTR lpsz);
#endif


#endif 