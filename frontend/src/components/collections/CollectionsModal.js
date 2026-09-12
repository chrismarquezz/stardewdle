import { scrollbarStyles } from "../../utils/scrollbarStyles";
import CustomModal from "../CustomModal";

export default function CollectionsModal({ isMuted, onClose, scaleFactor }) {
  return (
    <CustomModal
      title="Collections Page"
      isMuted={isMuted}
      onClose={onClose}
      scaleFactor={scaleFactor}
    >
          <div className={`space-y-2 md:space-y-4 text-main text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] pr-2 mb-4 ${scrollbarStyles}`}>
            <p>- Browse through all the crops from Stardew Valley</p>
            <p>- Click on any crop to view information such as:</p>
            <ul className="list-disc ml-6 md:ml-10">
              <li>Crop type</li>
              <li>Base selling price</li>
              <li>Growth time</li>
              <li>Regrow status</li>
              <li>Seasons of growth</li>
            </ul>
            <p>
              - You can also see how often a crop has been the daily crop
            </p>
            <p>
              - Use this page to prepare for your next guess
            </p>
          </div>
    </CustomModal>
  );
}
