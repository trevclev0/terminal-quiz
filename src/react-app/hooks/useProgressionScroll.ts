import { useEffect, useRef } from "react";

const scrollOptions: ScrollIntoViewOptions = { behavior: "smooth" };

function useProgressionScroll(nextRiddleIndex: number) {
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    // Scenario A: The game is over. Scroll to the ending
    if (nextRiddleIndex === -1) {
      const endingElement = document.getElementById("classic-ending");
      if (endingElement) {
        endingElement.scrollIntoView(scrollOptions);
      }
      return; // Exit early so we don't try to find a riddle
    }

    // Scenario B: The game is ongoing. Scroll to the next riddle.
    const nextRiddleElement = document.getElementById(
      `riddle-${nextRiddleIndex}`,
    );
    if (nextRiddleElement) {
      nextRiddleElement.scrollIntoView(scrollOptions);
    }
  }, [nextRiddleIndex]);
}

export default useProgressionScroll;
