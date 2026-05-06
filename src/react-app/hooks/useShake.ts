import { useEffect, useState } from "react";

function useShake() {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => setIsShaking(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  return {
    isShaking,
    shake: () => setIsShaking(true),
    clearShake: () => setIsShaking(false),
  };
}

export default useShake;
