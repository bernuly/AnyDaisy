/*
 *  TTSEngine.h
 *  mactts
 *
 *  Created by Alex Milowski on 3/16/09.
 *  Copyright 2009 Benetech. All rights reserved.
 *
 */
 
 #include <Cocoa/Cocoa.h>
 #include "nscore.h"
#define NS_OUTPARAM
 #include "nsXPCOM.h"
 #include "nsITTSEngine.h"
 #include "nsCOMPtr.h"

/**
 * The Voice class contains the speech synthesizer
 * and handles the callback.  It also manages the current
 * speaking text.
 *
 * This is done in Objective C so that it can be the
 * delegate for the "end of speaking" notification.
 */
@interface Voice : NSObject {
   NSSpeechSynthesizer *_synth;
   nsITTSCallback *callback;
   NSString *currentText;
}
- (id)init;
- (void)dealloc;
- (id)setCallback:(nsITTSCallback *) _value; 
- (nsITTSCallback *)getCallback; 
- (void)speak:(NSString *)text;
- (void)speechSynthesizer:(NSSpeechSynthesizer *)sender didFinishSpeaking:(BOOL)finishedSpeaking;
- (NSSpeechSynthesizer *) synth;

@end


class TTSEngine : public nsITTSEngine {
public:
    NS_DECL_ISUPPORTS
	NS_DECL_NSITTSENGINE
	
	TTSEngine(void);
	virtual ~TTSEngine(void);
private:
	Voice *voice;
};