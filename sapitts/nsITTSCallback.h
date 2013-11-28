/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM public/nsITTSCallback.idl
 */

#ifndef __gen_nsITTSCallback_h__
#define __gen_nsITTSCallback_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    nsITTSCallback */
#define NS_ITTSCALLBACK_IID_STR "48aad526-ee1f-4a02-a69f-5e60e4ceba7b"

#define NS_ITTSCALLBACK_IID \
  {0x48aad526, 0xee1f, 0x4a02, \
    { 0xa6, 0x9f, 0x5e, 0x60, 0xe4, 0xce, 0xba, 0x7b }}

/**
 * A particular TTS implemenation
 */
class NS_NO_VTABLE NS_SCRIPTABLE nsITTSCallback : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(NS_ITTSCALLBACK_IID)

  /**
   * notified when the speech stops
   */
  /* void onFinish (in boolean cancelled); */
  NS_SCRIPTABLE NS_IMETHOD OnFinish(PRBool cancelled) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(nsITTSCallback, NS_ITTSCALLBACK_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_NSITTSCALLBACK \
  NS_SCRIPTABLE NS_IMETHOD OnFinish(PRBool cancelled); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_NSITTSCALLBACK(_to) \
  NS_SCRIPTABLE NS_IMETHOD OnFinish(PRBool cancelled) { return _to OnFinish(cancelled); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_NSITTSCALLBACK(_to) \
  NS_SCRIPTABLE NS_IMETHOD OnFinish(PRBool cancelled) { return !_to ? NS_ERROR_NULL_POINTER : _to->OnFinish(cancelled); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class nsTTSCallback : public nsITTSCallback
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSITTSCALLBACK

  nsTTSCallback();

private:
  ~nsTTSCallback();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(nsTTSCallback, nsITTSCallback)

nsTTSCallback::nsTTSCallback()
{
  /* member initializers and constructor code */
}

nsTTSCallback::~nsTTSCallback()
{
  /* destructor code */
}

/* void onFinish (in boolean cancelled); */
NS_IMETHODIMP nsTTSCallback::OnFinish(PRBool cancelled)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_nsITTSCallback_h__ */
