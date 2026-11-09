import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));

export const formatTimeDifference = (
	date1: Date | string,
	date2: Date | string,
): string => {
	const first = new Date(date1);
	const second = new Date(date2);
	const diffInSeconds = Math.floor(
		Math.abs(second.getTime() - first.getTime()) / 1000,
	);

	if (diffInSeconds < 60) {
		return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''}`;
	}
	if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
	}
	if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours} hour${hours !== 1 ? 's' : ''}`;
	}
	if (diffInSeconds < 31536000) {
		const days = Math.floor(diffInSeconds / 86400);
		return `${days} day${days !== 1 ? 's' : ''}`;
	}

	const years = Math.floor(diffInSeconds / 31536000);
	return `${years} year${years !== 1 ? 's' : ''}`;
};
