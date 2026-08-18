import AppKit
import Foundation

private let appSnapSoundSteps = [
    (path: "/System/Library/Sounds/Tink.aiff", volume: Float(0.16)),
    (path: "/System/Library/Sounds/Pop.aiff", volume: Float(0.22)),
]

func playAppSnapShutterSound() throws {
    for (index, step) in appSnapSoundSteps.enumerated() {
        guard let sound = NSSound(contentsOfFile: step.path, byReference: true) else {
            throw AppSnapFailure(
                code: "sound_unavailable",
                message: "The AppSnap shutter sound is unavailable."
            )
        }
        sound.volume = step.volume
        sound.play()
        if index < appSnapSoundSteps.count - 1 {
            Thread.sleep(forTimeInterval: 0.07)
        } else {
            Thread.sleep(forTimeInterval: 0.25)
        }
    }
}
