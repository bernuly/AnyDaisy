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

#ifndef _IOBABTTS_H
#define _IOBABTTS_H
#	ifndef WINAPI
#		define WINAPI
#	endif

//helper
#ifndef SETBIT
#define  SETBIT(x)      ((unsigned long)1 << (x))
#endif

//! defines a default value
#define		BABTTS_USEDEFAULT		0xffffffff


//! A babil object
typedef void*	LPBABTTS;

//Speak modes
#define BABTTS_SYNC			    0x00000000
#define BABTTS_ASYNC			0x40000000

#define BABTTS_TEXT				0x00000000
#define BABTTS_FILE				0x00000001

#define BABTTS_TXT_ANSI					0x00000000
#define BABTTS_TXT_OEM					0x00000002
#define BABTTS_TXT_UC2					0x00000004
#define BABTTS_TXT_UTF8					0x00000008
#define BABTTS_TXT_MACROMAN				0x00000010


#define BABTTS_TAG_NO					0x00000000
#define BABTTS_TAG_SAPI					0x00000040

#define BABTTS_FILE_RAW					0x00008000	
#define	BABTTS_FILE_WAV					0x00010000	
#define	BABTTS_FILE_AU					0x00020000		
#define	BABTTS_FILE_VOX					0x00040000
#define BABTTS_FILE_AIFF				0x00080000

#define	BABTTS_READ_DEFAULT				0x00000000 
#define	BABTTS_READ_TEXT				0x00400000
#define BABTTS_READ_WORD				0x00800000 //letter by letter
#define BABTTS_READ_LETTER				0x01000000  //word by word


//Open mode
#define BABTTS_USEDEFDICT			0x00000004l
 


//! dialog types
typedef enum 
{
	//! Open a dialog for editing the user lexicon
	BABTTS_DLG_LEXICON=0x00000002l,
	BABTTS_DLG_PROPERTIES=0x00000003l,

	
}BabTtsDlg;

//! wave format accepted by BabTTS
typedef enum 
{
	//! 8 bits linear 
	BABTTS_FORMAT_PCM8=0x0000,
	//! 16 bits linear
	BABTTS_FORMAT_PCM=0x0001,
	//! A-law
	BABTTS_FORMAT_ALAW=0x0006,  
	//! Mu-law
	BABTTS_FORMAT_MULAW=0x0007,  
	//! ADPCM (dialogic)
	BABTTS_FORMAT_OKI_ADPCM=0x000A  
}BabTtsFormat;

typedef enum 
{
	BABTTS_PAUSE_DEFAULT=0, 
	BABTTS_PAUSE_VERYSHORT=1, 
	BABTTS_PAUSE_SHORT=2,
	BABTTS_PAUSE_MEDIUM=3,
	BABTTS_PAUSE_LONG=4,
	BABTTS_PAUSE_VERYLONG=5,
}BabTtsPause;

//! The last known status of engine
typedef enum 
{
	//! Non initialized
	BABTTS_STATUS_UNINIT=0x00000000,
	//! Wait a command
	BABTTS_STATUS_IDLE=0x00000001,
	//! Data are in the queue
	BABTTS_STATUS_QUEUED=0x00000002,
	//! User is working with object
	BABTTS_STATUS_PLAYING=0x00000004,
	//! We are leaving the playing mode
	BABTTS_STATUS_UNCLAIM=0x00000008,
	//! Pause mode
	BABTTS_STATUS_PAUSED=0x00000010,
	//! The object is beeing destructed
	BABTTS_STATUS_CLOSING=0x00000020,
	//! Some data are still in the object
	BABTTS_STATUS_PENDING=0x00000040
}BabTtsStatus;


/*Dictionaries*/

//! Grammatical type of word for the user dictionary
typedef	enum 
{
	
	BABTTS_WORDTYPE_UNKNOWN=0x00000000,	//!< UNKNOWN
	BABTTS_WORDTYPE_NOUN=0x00000001,		//!< NOUN
	BABTTS_WORDTYPE_VERB=0x00000002,		//!< VERB
	BABTTS_WORDTYPE_ADVERB=0x00000004,		//!< ADVERB
	BABTTS_WORDTYPE_ADJECTIVE=0x00000008,	//!< ADJECTIVE
	BABTTS_WORDTYPE_PROPERNOUN=0x00000010,	//!< PROPERNOUN
	BABTTS_WORDTYPE_PRONOUN=0x00000020,	//!< PRONOUN
	BABTTS_WORDTYPE_CONJUNCTION=0x00000040,//!< CONJUNCTION
	BABTTS_WORDTYPE_CARDINAL=0x00000080,	//!< CARDINAL
	BABTTS_WORDTYPE_ORDINAL=0x00000100,	//!< ORDINAL
	BABTTS_WORDTYPE_DETERMINER=0x00000200,	//!< DETERMINER
	BABTTS_WORDTYPE_QUANTIFIER=0x00000400,	//!< QUANTIFIER
	BABTTS_WORDTYPE_PUNCTUATION=0x00000800,//!< PUNCTUATION
	BABTTS_WORDTYPE_CONTRACTION=0x00001000,//!< CONTRACTION
	BABTTS_WORDTYPE_INTERJECTION=0x00002000,//!< INTERJECTION
	BABTTS_WORDTYPE_ABBREVIATION=0x00004000,//!< ABBREVIATION
	BABTTS_WORDTYPE_PREPOSITION=0x00008000	//!< PREPOSITION
		
} BabTtsWordType;


/** Properties of a dictionary
* 
*/
typedef enum 
{
	//! The dictionary is enabled
	BABTTS_DICT_ENABLED=SETBIT(0),
	//! User cannot see the content of dictionary
	BABTTS_DICT_READ=SETBIT(1),
	//! User cannot edit the dictionary
	BABTTS_DICT_WRITE=SETBIT(2),
	//! Dictionary not enumerated
	BABTTS_DICT_SYSTEM=SETBIT(3),
	//! Password protected
	BABTTS_DICT_PASSWORD=SETBIT(4),
	//! Dictionary has been modified
	BABTTS_DICT_MODIFIED=SETBIT(5)
}BabTtsDictProperties;

/** This structure gives information about a dictionary (from the header) 
  * 
*/
typedef struct tagDictInfo
{
	//! The corresponding filename
	char	szFilename[256];
	//! The language for which the dictionary is
	char	szLanguage[50];
	//! Internal version for version check.
	char	szVersion[20];
	//! The number of entries
	unsigned long	dwNumEntries;
	//! The revision of the dictionary (number of "save" made by user)
	unsigned long	dwRevision;
	//! time_t equivalent of the creation date 
	long	tCreated;
	//! time_t equivalent of the last modification date 
	long	tModified;
	/**Indicates if the dictionary can be edited by user
	  * @remarks combination of BABTTS_DICTPROPERTIES flag
	  */
	unsigned long	dwProperties;
	//! User Description for the dictionary
    	char    szDescription[256];
    	//! User Name for the dictionary
    	char    szDiconame[256];
}BABTTSDICTINFO;

/** Pointer to a DictInfo structure
  * 
  */
typedef	BABTTSDICTINFO* LPBABTTSDICTINFO;

/** A dictionary instance
  * 
  */
typedef void*	LPBABTTSDICT;


//! events associated with Phonemes (bit field)
typedef	enum  //?
{
	BABTTS_EVENT_WORD=SETBIT(0),		//!< The phoneme is a word boundary
	BABTTS_EVENT_SENTENCE=SETBIT(1),	//!< The phoneme is a sentence boundary (generally the first silence)
	BABTTS_EVENT_USERMRK=SETBIT(2),	//!< The phoneme position is synchronized with the SAPI \Mrk=XXXX\ tag (User tag)
	BABTTS_EVENT_TEXTBEGIN=SETBIT(3),	//!< First phoneme of a text
	BABTTS_EVENT_VOLUME=SETBIT(4),	//!< Actually not used (Must correspond to the SAPI \VOL=XXX\ tag)
	BABTTS_EVENT_TEXTEND=SETBIT(6),	//!< Last phoneme of a text
	BABTTS_EVENT_RESERVED1=SETBIT(24),	//!< Internal
	BABTTS_EVENT_PHONE=SETBIT(31)		//!< This is a phoneme 
} BabTtsEvent;

//! Errors and warnings allowed in Babil
typedef enum 
{
	E_BABTTS_DICT_BADVERSION	= -26, //! The dictionary version is too old ... Use the conversion tool
	E_BABTTS_LIBNOTINITIALIZED = -25,
	E_BABTTS_NOTVALIDLICENSE= -24,	//!< The license key is not valid for the requested function
	E_BABTTS_NODICT=-23,				//!< No dictionary 
	E_BABTTS_NODBA=-22,				//!< A data file is missing
	E_BABTTS_NOTIMPLEMENTED=-21,		//!< The function is not yet implemented
	E_BABTTS_DICT_NOENTRY=-20,		//!< The user lexicon is empty
	E_BABTTS_DICT_READ=-19,			//!< Error reading the lexicon file
	E_BABTTS_DICT_WRITE=-18,			//!< Error when attempting to write to the file.
	E_BABTTS_DICT_OPEN=-17,			//!< The specified dictionary doesn't exist
	E_BABTTS_BADPHO=-16,				//!< An incorrect phoneme was introduced
	E_BABTTS_FILEOPEN=-15,			//!< Error when opening a file
	E_BABTTS_FILEWRITE=-14,			//!< Error when attempting to write to a file
	E_BABTTS_INVALIDTAG=-13,			//!< The inserted tag is invalid (obsolette)
	E_BABTTS_NONLP=-12,				//!< The NLP object is invalid/doesn't exist
	E_BABTTS_THREADERROR=-11,		//!< Error when attempting to start a new thread
	E_BABTTS_NOTVALIDPARAMETER=-10,	//!< A parameter/argument is not valid
	E_BABTTS_NOREGISTRY=-9,			//!< The required registry keys are not valid / do not exist 
	E_BABTTS_REGISTRYERROR=-8,		//!< Bad information in the registry
	E_BABTTS_PROCESSERROR=-7,		//!< "Generic"/unhandled error	
	E_BABTTS_WAVEOUTNOTFREE=-6,		//!< Can't open the output device 
	E_BABTTS_WAVEOUTWRITE=-5,		//!< Can't write to the output device
	E_BABTTS_SPEAKERROR=-4,			//!< Error while Speaking or processing text
	E_BABTTS_ISPLAYING=-3,			//!< Already in play mode or currently processing text (obsolete)
	E_BABTTS_MEMFREE=-2,				//!< Problem when freeing memory
	E_BABTTS_NOMEM=-1,				//!< No memory for allocation
	E_BABTTS_NOERROR=0,				//!< No error
	W_BABTTS_NOTPROCESSED=1,			//!< The processing was not done
	W_BABTTS_NOTFULLYPROCESSED=2,		//!< The processing was not fully processed. Need to call the function one more time to complete the process.
	W_BABTTS_NOMOREDATA=3
}BabTtsError;

/*
#define BABTTS_READ_SENTENCE 0
#define BABTTS_READ_WORD	 1
#define BABTTS_READ_LETTER   2
*/

//! Parameters //?
typedef enum 
{
	BABTTS_PARAM_VOICE=1,
	BABTTS_PARAM_PITCH=2,
	BABTTS_PARAM_SPEED=3,
	BABTTS_PARAM_WAVEFORMAT=4,
	BABTTS_PARAM_VOLUME=5,
	BABTTS_PARAM_MAXPITCH=9,
	BABTTS_PARAM_MINPITCH=10,
	BABTTS_PARAM_VOLUMERATIO=11,
	BABTTS_PARAM_CBINSTANCE=12,
	BABTTS_PARAM_LEADINGSILENCE=13,
	BABTTS_PARAM_TRAILINGSILENCE=15,
	BABTTS_PARAM_DEVICE=16,
	BABTTS_PARAM_MSGMASK=17,
	BABTTS_PARAM_READINGMODE=18,
	BABTTS_PARAM_PAUSEPUNCT=19,
	BABTTS_PARAM_PAUSESEMICOLON=20,
	BABTTS_PARAM_PAUSECOMMA=21,
	BABTTS_PARAM_PAUSEBRACKET=22,
	BABTTS_PARAM_PAUSESPELL=23,
	BABTTS_PARAM_USEFILTER=24,
	BABTTS_PARAM_FILTERVALUE1=25,
	BABTTS_PARAM_FILTERVALUE2=26,
	BABTTS_PARAM_FILTERVALUE3=27,
	BABTTS_PARAM_FILTERVALUE4=28,
	BABTTS_PARAM_VOCALTRACT=29,
	BABTTS_PARAM_LASTPARAM=BABTTS_PARAM_VOCALTRACT,
}BabTtsParam;


//Wnd messages
#define BABTTS_MSG_SPEAK			(0x2000)
#define BABTTS_MSG_END				(0x2001)
#define BABTTS_MSG_PAUSE			(0x2002)
#define BABTTS_MSG_RESUME			(0x2003)

#define BABTTS_MSG_TEXTBEGIN		(0x2008)
#define BABTTS_MSG_TEXTEND			(0x2009)

#define	BABTTS_MSG_WORD				(0x2004)
#define BABTTS_MSG_SENTENCE			(0x2005)
#define BABTTS_MSG_PHONE			(0x2006)
#define BABTTS_MSG_USERMRK			(0x2007)


//! Defines the type of typical use for this speechfont 
typedef enum 
{
	//! The speechfont is global for all user
	BABTTS_TYPE_GLOBAL=0,
	//! The speechfont is specific for this user
	BABTTS_TYPE_USER=1
}BabTtsType;

//! Defines the synthesizer technology used
typedef enum 
{
	//! Babil 4.x SpeechFont 
	BABTTS_SYNTH_BABIL=0,
	//! BrightSpeech 1.x SpeechFont
	BABTTS_SYNTH_BRIGHT=1,
	BABTTS_SYNTH_BRIGHTSPEECH=BABTTS_SYNTH_BRIGHT,
	BABTTS_SYNTH_UNKNOWN=0xFFFFFFFF,

}BabTtsSynth;

//! Defines possible sampling rate of the speechfont
typedef enum 
{
	//! 6 kHz (reserved)
	BABTTS_SAMP_6KHZ=6,
	//! 8 kHz (for telephony)
	BABTTS_SAMP_8KHZ=8,
	//! 11 kHz (for telephony)
	BABTTS_SAMP_11KHZ=11,
	//! 16 kHz (for multimedia)
	BABTTS_SAMP_16KHZ=16,
	//! 22 kHz (for multimedia)
	BABTTS_SAMP_22KHZ=22,
	//! 32 kHz (reserved)
	BABTTS_SAMP_32KHZ=32,
	//! 44 kHz (reserved)
	BABTTS_SAMP_44KHZ=44,
	//!unknown
	BABTTS_SAMP_UNKNOWN=0xFFFFFFFF
}BabTtsSamplingRate;

//! Gender of the spechfont
typedef enum 
{
	//! No information
	BABTTS_GENDER_NEUTRAL =0,
	//! Female
	BABTTS_GENDER_FEMALE =1,                 
	//! Male
	BABTTS_GENDER_MALE=2
}BabTtsGender;

//! Information about the age of the speechfont
typedef enum 
{
	BABTTS_BABY=1,
	BABTTS_TODDLER=3,
	BABTTS_CHILD=6,
	BABTTS_ADOLESCENT=14,
	BABTTS_ADULT=30,
	BABTTS_ELDERLY=70
}BabTtsAge;


/*! A structured information about SpeechFonts 
*/

typedef struct 
{
	//! The name of the SpeechFont
	char	szName[32];
	//! The name of the speaker
	char	szSpeaker[32];
	//! The Language
	char	szLanguage[32];
	//! The Version of the Engine (Major, Minor, reserved)
	char	szVersion[32];	
	//! The sampling rate
	BabTtsSamplingRate	Freq;
	//! User or Global   
	BabTtsType  Type;
	//! The synthesizer used
	BabTtsSynth Synth;
	//! The Gender of the speechfont 
	BabTtsGender	Gender;
	//! The age of the speechfont
	BabTtsAge			Age;
} BABTTSINFO;

typedef enum
{
	LIC_TYPE_NONE=0,
	LIC_TYPE_SOFT=1,
	LIC_TYPE_DONGLE=2,
	LIC_TYPE_BUNDLING=3,
	LIC_TYPE_BUNDLINGFULL=4,//no limit
	LIC_TYPE_SERVER=5
}LicType;

typedef enum
{
	LIC_RIGHT_DEMO=1,
	LIC_RIGHT_COM=2,
	LIC_RIGHT_EVAL=3,
}LicRight;
typedef enum 
{
	LIC_FEAT_SAPI4=1,
	LIC_FEAT_SAPI5=2,
	LIC_FEAT_REALTIME=4,
	LIC_FEAT_BUFFER=8,
	LIC_FEAT_ENUM=16,
	LIC_FEAT_PHONETIC=32,
	LIC_FEAT_NETWORK=64,

}
LicFeatures;
typedef struct 
{
	//! The Type of license (commercial, eval, demo)
	LicRight Right;
	//! The Type of protection (software, dongle, bundling)
	LicType Type;
	//! The Max number of channels allowed
	long	dwMaxChannels;
	//! The Actual number of channels
	long	dwCurrentChannels;
	//! Allowed features (see LicFeatures enum)
	unsigned long dwFeatures;
	//!Remaining Days
	unsigned long dwRemainingDays;
} BABTTSLICINFO;

#define BABTTS_CB_NONE				0x00000000l
#define BABTTS_CB_WINDOW			0x00000001l		/*  callback  HWND */
#define BABTTS_CB_FUNCTION			0x00000002l		/* callback  function*/


// stucture sent when sentence/word 
typedef struct 
{
	unsigned long dwPos;
	unsigned long dwLength;
	unsigned long dwTimeStamp;
	unsigned long dwDuration;
}BABTTSUNITINFO;


//! interface for the callback function mecanism
typedef BabTtsError (WINAPI *BabTTSProc)(LPBABTTS lpCbInstance, unsigned long msg, unsigned long wParam, unsigned long lParam);


/*! This structure describes mouth position (similart as the SAPI MOUTH struct)
*/
typedef struct 
{
   unsigned char     bMouthHeight;   //!< Height of the mouth or lips. This is a linear range from 0xFF for the maximum possible height for the mouth to 0x00 for the minimum height (that is, the mouth or lips are closed).
   unsigned char     bMouthWidth;	//!< Width of the mouth or lips. This is a linear range from 0xFF for the maximum possible width for the face to 0x00 for the minimum width (that is, the mouth or lips are puckered).
   unsigned char     bMouthUpturn;	//!< Extent to which the mouth turns up at the corners (that is, how much it smiles). This is a linear range from 0xFF for the maximum upturn (that is, the mouth is fully smiling) to 0x00 if the corners of the mouth turn down. If this member is 0x80, the mouth is neutral.
   unsigned char     bJawOpen;		//!< Angle to which the jaw is open. This is a linear range from 0xFF for completely open to 0x00 for completely closed.
   unsigned char     bTeethUpperVisible;	//!< Extent to which the upper teeth are visible. This is a linear range from 0xFF for the maximum extent (that is, the upper teeth and gums are completely exposed) to 0x00 for the minimum (the upper teeth are completely hidden). If this member is 0x80, only the teeth are visible.
   unsigned char     bTeethLowerVisible;	//!< Extent to which the lower teeth are visible. This is a linear range from 0xFF for the maximum extent (that is, the lower teeth and gums are completely exposed) to 0x00 for the minimum (the lower teeth are completely hidden.) If this member is 0x80, only the teeth are visible.
   unsigned char     bTonguePosn;	//!< Tongue position. This a linear range from 0xFF if the tongue is against the upper teeth, to 0x00 if it is relaxed. If this member is 0x80, the tongue is visible.
   unsigned char     bLipTension;	//!< Lip tension. This is a linear range from 0xFF if the lips are very tense to 0x00 if they are completely relaxed.
} BABTTSMOUTH;

#endif //_IOBABILSDK_H
