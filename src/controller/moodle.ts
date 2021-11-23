import ical from 'node-ical';

namespace MoodleCtrl {
    export interface MoodleEvent {
        id: string;
        categories: string[];
        summary: string;
        description: string;
        start: Date;
        end: Date;
    }
}

class MoodleCtrl {
    static convertCalendar(events: ical.CalendarResponse): MoodleCtrl.MoodleEvent[] {
        const result: MoodleCtrl.MoodleEvent[] = [];

        for (const id of Object.keys(events)) {
            const event = events[id];
            if (event.type !== "VEVENT")
                continue;
            if (!event.summary ||
                    !(event.summary.toLowerCase().includes("is due") ||
                    event.summary.toLowerCase().includes("abschluss erwartet für")))
                continue;
            if (event.end < new Date())
                continue;

            result.push({
                id,
                // @ts-ignore
                categories: event.categories,
                summary: event.summary.replace(" is due", "").replace("Abschluss erwartet für ", ""),
                description: event.description,
                start: event.start,
                end: event.end
            });
        }

        return result;
    }

    static async getEvents(url: string) {
        return ical.async.fromURL(url).then(MoodleCtrl.convertCalendar);
    }
}

export default MoodleCtrl;