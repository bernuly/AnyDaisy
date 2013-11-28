/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.benetech.daisyfox.tts;

import com.sun.speech.freetts.Voice;
import com.sun.speech.freetts.VoiceManager;
import com.sun.speech.freetts.audio.JavaClipAudioPlayer;

/**
 * Simple program to demonstrate the use of the FreeTTS speech
 * synthesizer.  This simple program shows how to use FreeTTS
 * without requiring the Java Speech API (JSAPI).
 */
public class TTSEngine {

    /**
     * Example of how to list all the known voices.
     */
    public static void listAllVoices() {
        System.out.println();
        System.out.println("All voices available:");
        VoiceManager voiceManager = VoiceManager.getInstance();
        Voice[] voices = voiceManager.getVoices();
        for (int i = 0; i < voices.length; i++) {
            System.out.println("    " + voices[i].getName()
                               + " (" + voices[i].getDomain() + " domain)");
        }
    }

    public static void main(String[] args) {

        listAllVoices();

        String voiceName = (args.length > 0)
            ? args[0]
            : "kevin16";

        System.out.println();
        System.out.println("Using voice: " + voiceName);

        TTSEngine engine = new TTSEngine();

        TTSContext context = engine.getContext(voiceName);

        if (context == null) {
            System.err.println(
                "Cannot find a voice named "
                + voiceName + ".  Please specify a different voice.");
            System.exit(1);
        }

        context.speak(args.length>1 ? args[1] : "Thank you for giving me a voice. I'm so glad to say hello to this world.");
        while (!context.isDone()) {
           try {
              Thread.currentThread().sleep(500);
           } catch (Exception ex) {
              ex.printStackTrace();
           }
        }

        System.exit(0);
    }

    public TTSEngine() {
    }

    public TTSContext getContext(String voiceName) {
        VoiceManager voiceManager = VoiceManager.getInstance();
        Voice voice = voiceManager.getVoice(voiceName);
        return voice==null ? null : new TTSContext(voice);
    }

}
