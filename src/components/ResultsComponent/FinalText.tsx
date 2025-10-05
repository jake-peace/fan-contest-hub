import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FinalTextProps {
	showCelebration: boolean;
}

const FinalText: React.FC<FinalTextProps> = ({ showCelebration }) => {
	return (
		<div className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg text-center">
			<AnimatePresence mode="wait">
				{showCelebration ? (
					<motion.div
						key="winner-text"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.5 }}
					>
						The Winner Is...
					</motion.div>
				) : (
					<motion.div
						key="suspense-text"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.5 }}
					>
						And the winner is...
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default FinalText;
