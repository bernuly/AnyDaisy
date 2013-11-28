/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.benetech.daisyfox.tts;

import com.sun.speech.freetts.Voice;

/**
 *
 * @author alex
 */
public class TTSContext {

   Thread voiceThread;
   Voice voice;
   boolean done;
   public TTSContext(Voice voice) {
      this.voice = voice;
      this.voiceThread = null;
      this.done = false;
   }

   public boolean speak(final String text) {
      voice.allocate();
      if (text==null) {
         return false;
      }
      voiceThread = new Thread(new Runnable() {
         public void run() {
            voice.speak(text);
            voice.deallocate();
            done = true;
            voiceThread = null;
         }
      });
      voiceThread.start();
      return true;
   }

   public void stop() {
      voice.deallocate();
      done = true;
   }

   public boolean isDone() {
      return done;
   }
}
