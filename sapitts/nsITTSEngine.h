/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM public/nsITTSEngine.idl
 */

#ifndef __gen_nsITTSEngine_h__
#define __gen_nsITTSEngine_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif
class nsITTSCallback; /* forward declaration */


/* starting interface:    nsITTSEngine */
#define NS_ITTSENGINE_IID_STR "6e6a05b8-f1e8-44c5-8d3a-d2dad4f3ae5c"

#define NS_ITTSENGINE_IID \
  {0x6e6a05b8, 0xf1e8, 0x44c5, \
    { 0x8d, 0x3a, 0xd2, 0xda, 0xd4, 0xf3, 0xae, 0x5c }}

/**
 * A particular TTS implemenation
 */
class NS_NO_VTABLE NS_SCRIPTABLE nsITTSEngine : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(NS_ITTSENGINE_IID)

  /**
   * The name of the engine
   */
  /* readonly attribute AString name; */
  NS_SCRIPTABLE NS_IMETHOD GetName(nsAString & aName) = 0;

  /**
   * Indicates whether the current engine is speaking
   */
  /* boolean isSpeaking (); */
  NS_SCRIPTABLE NS_IMETHOD IsSpeaking(PRBool *_retval NS_OUTPARAM) = 0;

  /**
   * Cancels any in progress speech
   */
  /* void cancel (); */
  NS_SCRIPTABLE NS_IMETHOD Cancel(void) = 0;

  /**
   * Starts speaking the text provided.
   * @param text The text to speak.
   * @param callback a callback for the speech
   */
  /* void speak (in AString text, in nsITTSCallback callback); */
  NS_SCRIPTABLE NS_IMETHOD Speak(const nsAString & text, nsITTSCallback *callback) = 0;

  /* readonly attribute PRInt32 minimumRate; */
  NS_SCRIPTABLE NS_IMETHOD GetMinimumRate(PRInt32 *aMinimumRate) = 0;

  /* readonly attribute PRInt32 normalRate; */
  NS_SCRIPTABLE NS_IMETHOD GetNormalRate(PRInt32 *aNormalRate) = 0;

  /* readonly attribute PRInt32 maximumRate; */
  NS_SCRIPTABLE NS_IMETHOD GetMaximumRate(PRInt32 *aMaximumRate) = 0;

  /* readonly attribute AString rateUnit; */
  NS_SCRIPTABLE NS_IMETHOD GetRateUnit(nsAString & aRateUnit) = 0;

  /* attribute PRInt32 rate; */
  NS_SCRIPTABLE NS_IMETHOD GetRate(PRInt32 *aRate) = 0;
  NS_SCRIPTABLE NS_IMETHOD SetRate(PRInt32 aRate) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(nsITTSEngine, NS_ITTSENGINE_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_NSITTSENGINE \
  NS_SCRIPTABLE NS_IMETHOD GetName(nsAString & aName); \
  NS_SCRIPTABLE NS_IMETHOD IsSpeaking(PRBool *_retval NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD Cancel(void); \
  NS_SCRIPTABLE NS_IMETHOD Speak(const nsAString & text, nsITTSCallback *callback); \
  NS_SCRIPTABLE NS_IMETHOD GetMinimumRate(PRInt32 *aMinimumRate); \
  NS_SCRIPTABLE NS_IMETHOD GetNormalRate(PRInt32 *aNormalRate); \
  NS_SCRIPTABLE NS_IMETHOD GetMaximumRate(PRInt32 *aMaximumRate); \
  NS_SCRIPTABLE NS_IMETHOD GetRateUnit(nsAString & aRateUnit); \
  NS_SCRIPTABLE NS_IMETHOD GetRate(PRInt32 *aRate); \
  NS_SCRIPTABLE NS_IMETHOD SetRate(PRInt32 aRate); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_NSITTSENGINE(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetName(nsAString & aName) { return _to GetName(aName); } \
  NS_SCRIPTABLE NS_IMETHOD IsSpeaking(PRBool *_retval NS_OUTPARAM) { return _to IsSpeaking(_retval); } \
  NS_SCRIPTABLE NS_IMETHOD Cancel(void) { return _to Cancel(); } \
  NS_SCRIPTABLE NS_IMETHOD Speak(const nsAString & text, nsITTSCallback *callback) { return _to Speak(text, callback); } \
  NS_SCRIPTABLE NS_IMETHOD GetMinimumRate(PRInt32 *aMinimumRate) { return _to GetMinimumRate(aMinimumRate); } \
  NS_SCRIPTABLE NS_IMETHOD GetNormalRate(PRInt32 *aNormalRate) { return _to GetNormalRate(aNormalRate); } \
  NS_SCRIPTABLE NS_IMETHOD GetMaximumRate(PRInt32 *aMaximumRate) { return _to GetMaximumRate(aMaximumRate); } \
  NS_SCRIPTABLE NS_IMETHOD GetRateUnit(nsAString & aRateUnit) { return _to GetRateUnit(aRateUnit); } \
  NS_SCRIPTABLE NS_IMETHOD GetRate(PRInt32 *aRate) { return _to GetRate(aRate); } \
  NS_SCRIPTABLE NS_IMETHOD SetRate(PRInt32 aRate) { return _to SetRate(aRate); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_NSITTSENGINE(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetName(nsAString & aName) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetName(aName); } \
  NS_SCRIPTABLE NS_IMETHOD IsSpeaking(PRBool *_retval NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->IsSpeaking(_retval); } \
  NS_SCRIPTABLE NS_IMETHOD Cancel(void) { return !_to ? NS_ERROR_NULL_POINTER : _to->Cancel(); } \
  NS_SCRIPTABLE NS_IMETHOD Speak(const nsAString & text, nsITTSCallback *callback) { return !_to ? NS_ERROR_NULL_POINTER : _to->Speak(text, callback); } \
  NS_SCRIPTABLE NS_IMETHOD GetMinimumRate(PRInt32 *aMinimumRate) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetMinimumRate(aMinimumRate); } \
  NS_SCRIPTABLE NS_IMETHOD GetNormalRate(PRInt32 *aNormalRate) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetNormalRate(aNormalRate); } \
  NS_SCRIPTABLE NS_IMETHOD GetMaximumRate(PRInt32 *aMaximumRate) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetMaximumRate(aMaximumRate); } \
  NS_SCRIPTABLE NS_IMETHOD GetRateUnit(nsAString & aRateUnit) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetRateUnit(aRateUnit); } \
  NS_SCRIPTABLE NS_IMETHOD GetRate(PRInt32 *aRate) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetRate(aRate); } \
  NS_SCRIPTABLE NS_IMETHOD SetRate(PRInt32 aRate) { return !_to ? NS_ERROR_NULL_POINTER : _to->SetRate(aRate); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class nsTTSEngine : public nsITTSEngine
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSITTSENGINE

  nsTTSEngine();

private:
  ~nsTTSEngine();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(nsTTSEngine, nsITTSEngine)

nsTTSEngine::nsTTSEngine()
{
  /* member initializers and constructor code */
}

nsTTSEngine::~nsTTSEngine()
{
  /* destructor code */
}

/* readonly attribute AString name; */
NS_IMETHODIMP nsTTSEngine::GetName(nsAString & aName)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* boolean isSpeaking (); */
NS_IMETHODIMP nsTTSEngine::IsSpeaking(PRBool *_retval NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void cancel (); */
NS_IMETHODIMP nsTTSEngine::Cancel()
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void speak (in AString text, in nsITTSCallback callback); */
NS_IMETHODIMP nsTTSEngine::Speak(const nsAString & text, nsITTSCallback *callback)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute PRInt32 minimumRate; */
NS_IMETHODIMP nsTTSEngine::GetMinimumRate(PRInt32 *aMinimumRate)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute PRInt32 normalRate; */
NS_IMETHODIMP nsTTSEngine::GetNormalRate(PRInt32 *aNormalRate)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute PRInt32 maximumRate; */
NS_IMETHODIMP nsTTSEngine::GetMaximumRate(PRInt32 *aMaximumRate)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute AString rateUnit; */
NS_IMETHODIMP nsTTSEngine::GetRateUnit(nsAString & aRateUnit)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* attribute PRInt32 rate; */
NS_IMETHODIMP nsTTSEngine::GetRate(PRInt32 *aRate)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}
NS_IMETHODIMP nsTTSEngine::SetRate(PRInt32 aRate)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_nsITTSEngine_h__ */
