#!/bin/sh
java -cp build/classes/java/lib/cmu_us_kal.jar:build/classes/java/lib/cmudict04.jar:build/classes/java/lib/cmulex.jar:build/classes/java/lib/cmutimelex.jar:build/classes/java/lib/en_us.jar:build/classes/java/lib/freetts.jar:build/classes/java/classes org.benetech.daisyfox.tts.TTSEngine $*
