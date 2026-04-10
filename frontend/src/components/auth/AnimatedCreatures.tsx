"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const creatures = [
  { color: "from-purple-400 to-purple-600", size: "w-32 h-40" },
  { color: "from-pink-400 to-pink-600", size: "w-24 h-36" },
  { color: "from-yellow-300 to-yellow-500", size: "w-28 h-32" },
  { color: "from-orange-300 to-orange-500", size: "w-40 h-28 rounded-full" },
];

export default function AnimatedCreatures({
  isPasswordVisible,
  status,
}: {
  isPasswordVisible: boolean;
  status: "idle" | "success" | "error";
}) {
  const [eyeX, setEyeX] = useState(0);
  const [eyeY, setEyeY] = useState(0);

  // 🎯 Mouse tracking
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setEyeX(x);
      setEyeY(y);
    };

    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // 🎭 Convert status → mood
  const mood =
    status === "success"
      ? "happy"
      : status === "error"
      ? "sad"
      : "idle";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-end gap-6">
        {creatures.map((c, i) => (
          <motion.div
            key={i}
            animate={{
              y: mood === "happy" ? [0, -10, 0] : 0,
              rotate: isPasswordVisible ? 180 : 0,
              scale: 1,
            }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className={`bg-gradient-to-br ${c.color} ${c.size} rounded-3xl flex items-center justify-center shadow-xl`}
          >
            {/* Eyes */}
            <div className="flex gap-3">
              <motion.div
                animate={{ x: eyeX, y: eyeY }}
                className="w-3 h-3 bg-black rounded-full"
              />
              <motion.div
                animate={{ x: eyeX, y: eyeY }}
                className="w-3 h-3 bg-black rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
