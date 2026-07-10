import tkinter as tk
from tkinter import ttk
from playsound import playsound
import os
import threading


class TongueDrumPracticeApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Tongue Drum Practice")
        self.root.geometry("700x800")
        self.root.configure(bg="#111827")

        self.note_map = {
            "1": "D4",
            "2": "E4",
            "3": "F#4",
            "4": "G4",
            "5": "A4",
            "6": "B2",
            "7": "C#5",
            "˙1": "D5",
            "˙2": "E5",
            "˙3": "F#5",
            "_3": "F#3",
            "_4": "G3",
            "_5": "A3",
            "_6": "B3",
            "_7": "C#4",
        }

        # Path to metronome audio file
        self.audio_file = os.path.join(os.path.dirname(__file__), "freesound_community-metronome-85688-[AudioTrimmer.com].mp3")

        self.melodies = {
            "D major scale": ["1", "2", "3", "4", "5", "6", "7", "1"],
            "Simple phrase": ["3", "5", "6", "5", "3", "1", "2", "3"],
            "Up and down": ["1", "3", "5", "7", "5", "3", "1"],
            "Classic step": ["1", "1", "2", "3", "3", "2", "1"],
            "Full range": ["_3", "_5", "1", "3", "5", "7", "˙2", "˙3"],
            "Upper octave": ["˙1", "˙2", "˙3", "˙2", "˙1"],
            "Lower octave": ["_3", "_4", "_5", "_6", "_7", "_6", "_5"],
        }

        self.current_sequence = list(self.melodies["D major scale"])
        self.current_index = 0
        self.is_playing = False
        self.after_id = None
        self.last_token = None

        self.build_ui()
        self.show_note("1")

    def build_ui(self):
        title = tk.Label(
            self.root,
            text="Tongue Drum Practice",
            font=("Segoe UI", 24, "bold"),
            fg="#f9fafb",
            bg="#111827",
        )
        title.pack(pady=(24, 8))

        subtitle = tk.Label(
            self.root,
            text="Follow the number, then feel the note and octave underneath it.",
            font=("Segoe UI", 12),
            fg="#d1d5db",
            bg="#111827",
        )
        subtitle.pack(pady=(0, 20))

        self.number_var = tk.StringVar(value="1")
        self.note_var = tk.StringVar(value="D4")
        self.bpm_var = tk.StringVar(value="60")

        # Frame for number display (current, previous, next)
        number_frame = tk.Frame(self.root, bg="#111827")
        number_frame.pack(pady=(8, 8))
        
        # Previous number (left)
        self.prev_label = tk.Label(
            number_frame,
            text=" ",
            font=("Segoe UI", 35, "bold"),
            fg="#9ca3af",
            bg="#111827",
        )
        self.prev_label.pack(side=tk.LEFT, padx=20)
        
        # Current number (center)
        self.current_label = tk.Label(
            number_frame,
            textvariable=self.number_var,
            font=("Segoe UI", 70, "bold"),
            fg="#fbbf24",
            bg="#111827",
        )
        self.current_label.pack(side=tk.LEFT, padx=20)
        self.number_label = self.current_label
        
        # Next number (right)
        self.next_label = tk.Label(
            number_frame,
            text=" ",
            font=("Segoe UI", 35, "bold"),
            fg="#9ca3af",
            bg="#111827",
        )
        self.next_label.pack(side=tk.RIGHT, padx=20)

        note_label = tk.Label(
            self.root,
            textvariable=self.note_var,
            font=("Segoe UI", 28),
            fg="#ffffff",
            bg="#111827",
        )
        note_label.pack(pady=(0, 24))

        controls = tk.Frame(self.root, bg="#111827")
        controls.pack(pady=10)

        self.start_button = tk.Button(
            controls,
            text="Start",
            command=self.start_playback,
            width=12,
            height=2,
            font=("Segoe UI", 12, "bold"),
        )
        self.start_button.pack(side=tk.LEFT, padx=8)

        pause_button = tk.Button(
            controls,
            text="Pause",
            command=self.pause_playback,
            width=12,
            height=2,
            font=("Segoe UI", 12, "bold"),
        )
        pause_button.pack(side=tk.LEFT, padx=8)

        reset_button = tk.Button(
            controls,
            text="Reset",
            command=self.reset_playback,
            width=12,
            height=2,
            font=("Segoe UI", 12, "bold"),
        )
        reset_button.pack(side=tk.LEFT, padx=8)

        settings = tk.Frame(self.root, bg="#111827")
        settings.pack(pady=20)

        tk.Label(settings, text="Melody:", fg="#f9fafb", bg="#111827", font=("Segoe UI", 11)).pack(side=tk.LEFT, padx=(0, 8))
        self.melody_var = tk.StringVar(value="D major scale")
        melody_menu = ttk.Combobox(
            settings,
            textvariable=self.melody_var,
            values=list(self.melodies.keys()),
            state="readonly",
            width=20,
        )
        melody_menu.pack(side=tk.LEFT, padx=(0, 16))
        melody_menu.bind("<<ComboboxSelected>>", self.on_melody_change)

        tk.Label(settings, text="Tempo (BPM):", fg="#f9fafb", bg="#111827", font=("Segoe UI", 11)).pack(side=tk.LEFT, padx=(0, 8))
        tempo_entry = ttk.Entry(settings, textvariable=self.bpm_var, width=8)
        tempo_entry.pack(side=tk.LEFT)
        ttk.Button(settings, text="Apply", command=self.apply_tempo).pack(side=tk.LEFT, padx=8)

        hint = tk.Label(
            self.root,
            text="Tip: use the number on the drum, then look at the note underneath it.",
            font=("Segoe UI", 10),
            fg="#9ca3af",
            bg="#111827",
        )
        hint.pack(pady=(18, 0))

    def format_display(self, token):
        """Format a token into its three-line display format"""
        if token.startswith('˙'):
            number = token[1]
            return '.\n' + number + '\n '
        elif token.startswith('_'):
            number = token[1]
            return ' \n' + number + '\n˙'
        else:
            return ' \n' + token + '\n '

    def play_metronome_sound(self):
        """Play metronome sound on a separate thread to avoid blocking"""
        try:
            if os.path.exists(self.audio_file):
                thread = threading.Thread(target=playsound, args=(self.audio_file,))
                thread.daemon = True
                thread.start()
        except:
            pass  # Silently fail if audio is not available

    def show_note(self, token):
        # Format current number
        display_number = self.format_display(token)
        self.number_var.set(display_number)
        self.note_var.set(self.note_map.get(token, "?"))
        
        # Get and display previous number (to the right)
        if self.current_index > 0:
            prev_token = self.current_sequence[self.current_index - 1]
            prev_display = self.format_display(prev_token)
            self.prev_label.config(text=prev_display)
        else:
            self.prev_label.config(text=" ")
        
        # Get and display next number (to the left)
        next_index = self.current_index + 1
        if next_index < len(self.current_sequence):
            next_token = self.current_sequence[next_index]
            next_display = self.format_display(next_token)
            self.next_label.config(text=next_display)
        else:
            self.next_label.config(text=" ")
        
        # Flash effect only when the same number repeats
        if token == self.last_token:
            self.root.after(100, lambda: self.number_var.set(" \n \n "))
            self.root.after(200, lambda: self.number_var.set(display_number))
        
        self.last_token = token

    def advance_sequence(self):
        if not self.is_playing:
            return

        # Play metronome sound immediately at the right time
        self.play_metronome_sound()

        if self.current_index >= len(self.current_sequence):
            self.current_index = 0

        token = self.current_sequence[self.current_index]
        self.show_note(token)
        self.current_index += 1

        interval_ms = max(250, int(60000 / max(1, int(self.bpm_var.get()))))
        self.after_id = self.root.after(interval_ms, self.advance_sequence)

    def start_playback(self):
        if self.is_playing:
            return
        self.is_playing = True
        self.start_button.config(state=tk.DISABLED)
        self.advance_sequence()

    def pause_playback(self):
        self.is_playing = False
        if self.after_id is not None:
            self.root.after_cancel(self.after_id)
            self.after_id = None
        self.start_button.config(state=tk.NORMAL)

    def reset_playback(self):
        self.pause_playback()
        self.current_index = 0
        self.show_note(self.current_sequence[0] if self.current_sequence else "1")
        self.start_button.config(state=tk.NORMAL)

    def on_melody_change(self, event=None):
        name = self.melody_var.get()
        if name in self.melodies:
            self.current_sequence = list(self.melodies[name])
            self.current_index = 0
            self.show_note(self.current_sequence[0] if self.current_sequence else "1")

    def apply_tempo(self):
        try:
            bpm = int(self.bpm_var.get())
        except ValueError:
            return
        self.bpm_var.set(str(max(40, min(220, bpm))))


def main():
    root = tk.Tk()
    app = TongueDrumPracticeApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
