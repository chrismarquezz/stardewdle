import { scrollbarStyles } from "../utils/scrollbarStyles";
import CustomModal from "./CustomModal";

export default function UpdatesModal({ isMuted, onClose, scaleFactor }) {
  return (
    <CustomModal title="What's New" isMuted={isMuted} onClose={onClose} scaleFactor={scaleFactor}>
      <div className={`space-y-2 md:space-y-4 text-main text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] pr-2 ${scrollbarStyles}`}>
        <div>
          <p className="font-semibold">v1.6 — September 2026</p>
          <ul className="list-disc ml-6 md:ml-10">
            <li>
              There are new games!
            </li>
            <li>
              Check them out on the <a href="https://www.stardewdle.com/minigames" className="underline clickable">Minigames</a> page. They can also be accessed from the <a href="https://www.stardewdle.com/" className="underline clickable">Home</a> page.
            </li>
            <li>
              There's a game that tests your knowledge on cooking, villagers, fishing, and geology.
            </li>
            <li>
              They're not as expansive as the main crop game, but give them a try nonetheless.
            </li>
            <li>
              If you want to give feedback on them, feel free to join the join the <a href="https://discord.gg/Fg56gpXXBK" className="underline clickable">Discord</a>.
            </li>
            <li>
              The "How to Play" has also been updated. It now contains more details on how the crops are categorized and chosen.
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">v1.5 — August 2026</p>
          <ul className="list-disc ml-6 md:ml-10">
            <li>
              There is now a custom eliminations feature! You can narrow down your options as you'd like.
            </li>
            <li>
              Hit the pencil button, and click any crops you would like to eliminate as a choice.
            </li>
            <li>
              We also opened up a <a href="https://ko-fi.com/stardewdlecom" className="underline clickable">Ko-fi</a>, if you'd like to help support the site as we continue to maintain it.
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">v1.4 — June 2026</p>
          <ul className="list-disc ml-6 md:ml-10">
            <li>
              We've added statistics!
            </li>
            <li>
              You can now see how many games you've played, what your win rate is, your average guess count, and your current streak.
            </li>
            <li>
              You can also see your guess distribution!
            </li>
            <li>
              You can see these in the same place you share your results (there's a new stats button).
            </li>
            <li>
              We also recently adjusted colors to be a bit more color-blind friendly.
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">v1.3.1 — February 2026</p>
          <ul className="list-disc ml-6 md:ml-10">
            <li>
              We decided to create a <a href="https://discord.gg/Fg56gpXXBK" className="underline clickable">Discord</a> server!
            </li>
            <li>
              Join if you want share your guesses, talk about the game, or just want to say hi.
            </li>
            <li>
              It's also the best spot to give feedback and any suggestions you may have.
            </li>
            <li>
              If you'd like to join, check out the button in the home page!
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">v1.3 — December 2025</p>
          <ul className="list-disc ml-6 md:ml-10">
            <li>
              Overhauled the hint system to provide useful hints
            </li>
            <li>
              You can now choose which hints you would like to see
            </li>
            <li>
              Make it as easy or as challenging as you like!
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">v1.2 — October 2025</p>
          <ul className="list-disc ml-6 md:ml-10">
            <li>
              Implemented a "What's New" button to inform players of updates
              and new features
            </li>
            <li>
              Added a stat to Collections to track how many times a crop has
              been the Daily Crop
            </li>
            <li>
              Created a hint feature that filters out crops as the player
              guesses
            </li>
            <li>New button styles on Game Page</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">v1.1 — June 2025</p>
          <ul className="list-disc ml-6 md:ml-10">
            <li>
              Added the Collections page, where you can refresh your memory on crop
              information
            </li>
            <li>Designed a mobile-friendly interface</li>
            <li>
              Now showing total guesses and correct guesses on share screen
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">v1.0 — May 2025</p>
          <ul className="list-disc ml-6 md:ml-10">
            <li>Released the first version of Stardewdle</li>
          </ul>
        </div>
      </div>
      <div className="space-y-2 md:space-y-4 text-main text-left text-md sm:text-2xl md:text-3xl leading-none mt-4 italic ">
        <p>
          Future updates will appear here as new changes are made!
        </p>
      </div>
    </CustomModal>
  );
}
