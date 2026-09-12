import { scrollbarStyles } from "../../utils/scrollbarStyles";
import CustomModal from "../CustomModal";

export default function HelpModal({ isMuted, onClose, scaleFactor, selectedGame }) {
  return (
    <CustomModal
      title="How to Play"
      isMuted={isMuted}
      onClose={onClose}
      scaleFactor={scaleFactor}
    >
      <div className={`space-y-2 md:space-y-4 text-main text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] max-w-[900px] pr-2 mb-4 ${scrollbarStyles}`}>
        {tutorials[selectedGame]}
      </div>

    </CustomModal>
  );
}

const tutorials = {
  "":
    <div>
      <p>- Test your knowledge on areas beyond just farming</p>
      <p>- Each bundle here has its own unique minigame to see how well rounded of a player you are</p>
      <p>- Click any bundle to start</p>
      <p>- Each one will have its own <span className="italic">How to Play</span> as well </p>
      <p>- Try your best to complete them all!</p>
    </div >
  ,
  "food":
    <div>
      <p>- How familiar are you with cooking?</p>
      <p>- You are shown the ingredients to a specific food item</p>
      <p>- Click the magnifying glass, and from there select the food you would like to guess</p>
      <p>- Submit the food once you are sure</p>
      <p>- Your results will display above the selection area</p>
      <p>- You have 15 guesses to get it right</p>
    </div >,
  //map: {},
  "npc":
    <div>
      <p>- How well do you listen to the villagers of the valley?</p>
      <p>- You are shown a quote from one of the villagers</p>
      <p>- Click the magnifying glass, and from there select the villager you would like to guess</p>
      <p>- Submit the villager once you are sure</p>
      <p>- Your results will display above the selection area</p>
      <p>- You have 6 guesses to get it right</p>
      <p>- Each incorrect guess will unlock one more quote, for up to 5 quotes</p>
    </div >,
  "minerals":
    <div>
      <p>- How familiar with the minerals and artifacts you can get from mining?</p>
      <p>- You are shown a blurred item that can be acquired from mining</p>
      <p>- Click the magnifying glass, and from there select the name of the item you would like to guess</p>
      <p>- They are organized alphabetically</p>
      <p>- If you don't remember them by name, you can toggle grayscale icons to help</p>
      <p>- Submit the item once you are sure</p>
      <p>- Your results will display above the selection area</p>
      <p>- You have 6 guesses to get it right</p>
      <p>- Each incorrect guess will make the item more clear</p>
    </div >,
  "fish":
    <div>
      <p>- How familiar are you with fishing?</p>
      <p>- This is a version of hangman</p>
      <p>- You are shown the blank letters to a specific fish's name</p>
      <p>- Click a letter that you would like to guess</p>
      <p>- Submit the letter once you are sure</p>
      <p>- If your letter is in the fish's name, it will show up in the blanks</p>
      <p>- You are only allowed to make 6 wrong guesses</p>
      <p>- If you want some help, you can click the hint and see the silhouette of the fish</p>
    </div >,
}