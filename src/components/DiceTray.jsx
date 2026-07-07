import './DiceTray.css'

/**
 * The dice tray: a wooden-rimmed green felt surface where dice will be
 * rolled. Currently just the empty tray — dice and rolling come later.
 */
export default function DiceTray() {
  return (
    <section className="dice-tray-frame">
      <div className="dice-tray-felt">
        {/* Dice will be rendered here */}
      </div>
    </section>
  )
}
