'use client';

import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { ChevronDownIcon } from 'lucide-react';
import { format, setHours, setMinutes, setSeconds } from 'date-fns';
import { Spinner } from '../ui/spinner';

interface DateTimeHandlerProps {
	value: Date;
	onChange: (value: Date) => void;
	disabled: boolean;
}

const DateTimeHandler: React.FC<DateTimeHandlerProps> = ({ value, onChange, disabled }) => {
	const [mounted, setMounted] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date>(value);
	const [timeString, setTimeString] = useState<string>(value ? format(value, 'HH:mm') : '');
	const [calendarOpen, setCalendarOpen] = useState(false);

	useEffect(() => {
		setMounted(true);

		setSelectedDate(value);
		setTimeString(format(value, 'HH:mm'));
	}, [value]);

	const handleDateChange = (date: Date) => {
		const newDate = new Date(date);
		setSelectedDate(newDate);
		// If we have a time, combine and update the form state
		if (timeString) {
			const [hours, minutes] = timeString.split(':').map(Number);
			let combined = setHours(newDate, hours);
			combined = setMinutes(combined, minutes);
			combined = setSeconds(combined, 0); // Always set seconds to 0
			onChange(combined);
		} else {
			// If there's no time, just pass the date
			onChange(newDate);
		}
	};

	// Handler for when the time is changed in the input field
	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTimeString = e.target.value;
		setTimeString(newTimeString);
		const [hours, minutes] = newTimeString.split(':').map(Number);

		// Combine the date and time and update the form state
		let combined = selectedDate ? new Date(selectedDate) : new Date(); // Use today's date if no date is selected
		combined = setHours(combined, hours);
		combined = setMinutes(combined, minutes);
		combined = setSeconds(combined, 0);

		onChange(combined);
	};

	if (!mounted) {
		return <Spinner />;
	}

	return (
		<div className="flex gap-4 flex-auto">
			<div className="flex flex-col gap-3">
				<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
					<PopoverTrigger asChild className="bg-input-background">
						<Button disabled={disabled} variant="outline" id="date-picker" className="w-32 justify-between font-normal">
							{selectedDate ? selectedDate.toLocaleDateString() : 'Select date'}
							<ChevronDownIcon />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto overflow-hidden p-0" align="start">
						<Calendar
							required
							mode="single"
							selected={selectedDate}
							captionLayout="dropdown"
							disabled={{ before: new Date() }}
							onSelect={handleDateChange}
						/>
					</PopoverContent>
				</Popover>
			</div>
			<div className="flex flex-col gap-3">
				<Input
					disabled={disabled}
					value={timeString}
					onChange={handleTimeChange}
					type="time"
					id="time-picker"
					step="900"
					className="bg-input-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
				/>
			</div>
		</div>
	);
};

export default DateTimeHandler;
