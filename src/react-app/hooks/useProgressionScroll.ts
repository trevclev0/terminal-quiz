import { useEffect, useRef } from "react";

const scrollOptions: ScrollIntoViewOptions = { behavior: "smooth" };

function useProgressionScroll(nextGateIndex: number) {
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    // Scenario A: The game is over. Scroll to the ending
    if (nextGateIndex === -1) {
      const endingElement = document.getElementById("classic-ending");
      if (endingElement) {
        endingElement.scrollIntoView(scrollOptions);
      }
      return; // Exit early so we don't try to find a gate
    }

    // Scenario B: The game is ongoing. Scroll to the next gate.
    const nextGateElement = document.getElementById(`gate-${nextGateIndex}`);
    if (nextGateElement) {
      nextGateElement.scrollIntoView(scrollOptions);
    }
  }, [nextGateIndex]);
}

export default useProgressionScroll;
