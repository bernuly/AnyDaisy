/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM public/nsITTSEngineFactory.idl
 */

#ifndef __gen_nsITTSEngineFactory_h__
#define __gen_nsITTSEngineFactory_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif
class nsITTSEngineFactory; /* forward declaration */

class nsITTSEngine; /* forward declaration */


/* starting interface:    nsITTSEngineFactory */
#define NS_ITTSENGINEFACTORY_IID_STR "87689d25-f94e-4e0f-9a0e-f8bc8c11d7a0"

#define NS_ITTSENGINEFACTORY_IID \
  {0x87689d25, 0xf94e, 0x4e0f, \
    { 0x9a, 0x0e, 0xf8, 0xbc, 0x8c, 0x11, 0xd7, 0xa0 }}

class NS_NO_VTABLE NS_SCRIPTABLE nsITTSEngineFactory : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(NS_ITTSENGINEFACTORY_IID)

  /**
 * Provides the ability to instantiate a particular TTS implementation
 */
/**
   * The priority relative to other engines
   */
  /* attribute long priority; */
  NS_SCRIPTABLE NS_IMETHOD GetPriority(PRInt32 *aPriority) = 0;
  NS_SCRIPTABLE NS_IMETHOD SetPriority(PRInt32 aPriority) = 0;

  /**
   * The name of the engine
   */
  /* readonly attribute AString name; */
  NS_SCRIPTABLE NS_IMETHOD GetName(nsAString & aName) = 0;

  /**
   * Initializes the factory
   * @return Returns true if the component initialized properly
   */
  /* boolean initialize (); */
  NS_SCRIPTABLE NS_IMETHOD Initialize(PRBool *_retval NS_OUTPARAM) = 0;

  /**
   * Checks the local system and indicates whether the
   * engine is available.
   */
  /* boolean isAvailable (); */
  NS_SCRIPTABLE NS_IMETHOD IsAvailable(PRBool *_retval NS_OUTPARAM) = 0;

  /**
   * Returns a list of all engines registered with the mediator
   */
  /* nsITTSEngine createEngine (); */
  NS_SCRIPTABLE NS_IMETHOD CreateEngine(nsITTSEngine **_retval NS_OUTPARAM) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(nsITTSEngineFactory, NS_ITTSENGINEFACTORY_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_NSITTSENGINEFACTORY \
  NS_SCRIPTABLE NS_IMETHOD GetPriority(PRInt32 *aPriority); \
  NS_SCRIPTABLE NS_IMETHOD SetPriority(PRInt32 aPriority); \
  NS_SCRIPTABLE NS_IMETHOD GetName(nsAString & aName); \
  NS_SCRIPTABLE NS_IMETHOD Initialize(PRBool *_retval NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD IsAvailable(PRBool *_retval NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD CreateEngine(nsITTSEngine **_retval NS_OUTPARAM); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_NSITTSENGINEFACTORY(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetPriority(PRInt32 *aPriority) { return _to GetPriority(aPriority); } \
  NS_SCRIPTABLE NS_IMETHOD SetPriority(PRInt32 aPriority) { return _to SetPriority(aPriority); } \
  NS_SCRIPTABLE NS_IMETHOD GetName(nsAString & aName) { return _to GetName(aName); } \
  NS_SCRIPTABLE NS_IMETHOD Initialize(PRBool *_retval NS_OUTPARAM) { return _to Initialize(_retval); } \
  NS_SCRIPTABLE NS_IMETHOD IsAvailable(PRBool *_retval NS_OUTPARAM) { return _to IsAvailable(_retval); } \
  NS_SCRIPTABLE NS_IMETHOD CreateEngine(nsITTSEngine **_retval NS_OUTPARAM) { return _to CreateEngine(_retval); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_NSITTSENGINEFACTORY(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetPriority(PRInt32 *aPriority) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetPriority(aPriority); } \
  NS_SCRIPTABLE NS_IMETHOD SetPriority(PRInt32 aPriority) { return !_to ? NS_ERROR_NULL_POINTER : _to->SetPriority(aPriority); } \
  NS_SCRIPTABLE NS_IMETHOD GetName(nsAString & aName) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetName(aName); } \
  NS_SCRIPTABLE NS_IMETHOD Initialize(PRBool *_retval NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->Initialize(_retval); } \
  NS_SCRIPTABLE NS_IMETHOD IsAvailable(PRBool *_retval NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->IsAvailable(_retval); } \
  NS_SCRIPTABLE NS_IMETHOD CreateEngine(nsITTSEngine **_retval NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->CreateEngine(_retval); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class nsTTSEngineFactory : public nsITTSEngineFactory
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSITTSENGINEFACTORY

  nsTTSEngineFactory();

private:
  ~nsTTSEngineFactory();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(nsTTSEngineFactory, nsITTSEngineFactory)

nsTTSEngineFactory::nsTTSEngineFactory()
{
  /* member initializers and constructor code */
}

nsTTSEngineFactory::~nsTTSEngineFactory()
{
  /* destructor code */
}

/* attribute long priority; */
NS_IMETHODIMP nsTTSEngineFactory::GetPriority(PRInt32 *aPriority)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}
NS_IMETHODIMP nsTTSEngineFactory::SetPriority(PRInt32 aPriority)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute AString name; */
NS_IMETHODIMP nsTTSEngineFactory::GetName(nsAString & aName)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* boolean initialize (); */
NS_IMETHODIMP nsTTSEngineFactory::Initialize(PRBool *_retval NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* boolean isAvailable (); */
NS_IMETHODIMP nsTTSEngineFactory::IsAvailable(PRBool *_retval NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* nsITTSEngine createEngine (); */
NS_IMETHODIMP nsTTSEngineFactory::CreateEngine(nsITTSEngine **_retval NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_nsITTSEngineFactory_h__ */
