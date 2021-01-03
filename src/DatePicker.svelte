<script>
    import { onMount } from 'svelte';
	import { slide, fade } from 'svelte/transition';
    import {format, parse} from 'date-format-parse';
    import Fa from "svelte-fa";
    import clickOutside from 'svelte-outside-click';
    import { faChevronLeft, faChevronRight, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
    
    export let init = "";
    export let textValue = init;
    export let dateValue = null;
    export let id = '_' + Math.random().toString(36).substr(2, 9);
    export let displayFormat = "DD/MM/YYYY";
    export let tooltipEnabled;
    export let _class;

    const dayOfWeekLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; 
    const parsingFormats = [    "YYYY/M/D", 
                                "DD/MM/YYYY",
                                "D/M/YYYY",
                                "D/M/YY",
                                "D/M",
                                "YYYYMMDD",
                                "DDMM",
                                "D"
                            ]; // TODO: allow to override the list of valid parsing formats through an exported property

    let tooltipVisible = false;
    let calendarVisible = false;
    let calendarRenderFinished = false;

    let today = new Date();
    today.setHours(0,0,0,0);

    let calendarYear;
    let calendarMonth;
    let calendarDates;

    onMount(async () => {
        parseTextValue();

        let dates = [
        "2021/01/04",
        "2021/1/4",
        "20210104",
        "04/01/2021",
        "4-1-2021",
        "4/1/21",
        "04-01",
        "4/1",
        "4",
        "04"]
        for(let d of dates) {
            console.log(d);
            textValue = d;
            parseTextValue();
        }
    });

    $: {
        if(calendarMonth < 0) {
            calendarMonth += 12;
            calendarYear -= 1;
        }
        if(calendarMonth > 11) {
            calendarMonth -= 12;
            calendarYear += 1;
        }
        let cursorDate = (new Date(calendarYear, calendarMonth, 1));
        let daysBack = cursorDate.getDay() <= 1 ? cursorDate.getDay() + 6 : cursorDate.getDay() - 1;
        cursorDate.setDate(new Date(cursorDate.getDate() - daysBack));

        calendarDates = [];
        do {
            calendarDates.push(new Date(cursorDate));
            cursorDate.setDate(new Date(cursorDate.getDate() + 1));
        } while(calendarDates.length < 42);
    }

    async function calendarDateSelected (date) {
        dateValue = date;
        textValue = format(dateValue, displayFormat);
        closeCalendar();
    }

    async function inputFocused(event) {
        const { selectionStart, selectionEnd, value } = this;
        this.selectionStart = 0;
        this.selectionEnd = value.length;
    }

    async function parseTextValue () {
        let matchesDiff = textValue.match("^(\\+|-)([0-9]+)(w)?");
        if(textValue === "0") {
            dateValue = new Date(today);
        } else if(matchesDiff) {
            let sign = matchesDiff[1];
            let diff = sign === "-" ? -matchesDiff[2] : matchesDiff[2];
            let workingDays = (matchesDiff[3] === "w"); // TODO: implement the calculation including only working days
            dateValue = new Date(today);
            dateValue.setDate(new Date(dateValue.getDate() + Number(diff)))
        }
        else {
            for (let format of parsingFormats) {
                format = format.replaceAll('-', '/').replaceAll('.', '/');
                textValue = textValue.replaceAll('-', '/').replaceAll('.', '/');
                dateValue = parse(textValue, format);
                if(dateValue != "Invalid Date") 
                    break;
            }
        }
        
        if(dateValue === null || dateValue === undefined || dateValue == "Invalid Date") {
            textValue = "";
            dateValue = null;
            calendarYear = today.getFullYear();
            calendarMonth = today.getMonth();
        } else {
            textValue = format(dateValue, displayFormat);
            calendarYear = dateValue.getFullYear();
            calendarMonth = dateValue.getMonth();
        }
    }
    
    async function openCalendar() {
        if(dateValue === null || dateValue === undefined) {
            calendarYear = today.getFullYear();
            calendarMonth = today.getMonth();
        } else {
            calendarYear = dateValue.getFullYear();
            calendarMonth = dateValue.getMonth();
        }
        calendarVisible = true;
    }

    async function closeCalendar() {
        if(calendarVisible && calendarRenderFinished)
            calendarVisible = false;
    }

    async function displayTooltip() {
        if(!tooltipEnabled)
            return;
        tooltipVisible = true;
        setTimeout(hideTooltip, 6000);
    }
    async function hideTooltip() {
        tooltipVisible = false;
    }

    function isHoliday(date) {
        // TODO: somehow add other holidays, not only saturday/sunday
        return date && (date.getDay() === 6 || date.getDay() === 0);
    }
</script>

<style>
    .calendarDate {
        @apply text-center w-6 h-5 p-0.5 cursor-pointer bg-gray-50;
    }
    .calendarDate :hover {
        @apply bg-blue-500 text-white;
    }
    .calendarHolidayDate {
        @apply text-pink-400;
    }
    .calendarPreviousMonthDate {
        @apply text-gray-400;
    }
    .calendarSelectedDate {
        @apply bg-blue-500 text-white;
    }
    .calendarTodayDate {
        @apply rounded-full border-2 border-blue-400;
    }
    .calendarArrowButton {
        @apply  p-0.5 cursor-pointer 
                border-opacity-0 border-2 border-blue-900;
    }
    .calendarArrowButton :hover {
        @apply  border-opacity-100 bg-blue-200;
    }
    .tooltip {
        @apply absolute w-full -right-full -top-full bg-blue-50 text-xs p-2 border-2 border-blue-200 bg-opacity-80;
    }
    .calendar select {
        -moz-appearance: none;
        -webkit-appearance: none;
        background: none;
        text-align-last: center;
    }
    .calendar input::-webkit-outer-spin-button,
    .calendar input::-webkit-inner-spin-button{
        -webkit-appearance: none;
        background: none;
    }
    .calendar input[type=number] {
        -moz-appearance: textfield;
        background: none;
    }
</style>

<div class="inline-block">
    <label for="{id}" class="{_class} relative inline-flex border-blue-900 border-2 rounded w-auto" on:mouseenter={displayTooltip} on:mouseleave={hideTooltip}  on:dblclick="{() => {textValue = "0"; parseTextValue();}}">
        <input id="{id}" placeholder="{displayFormat}" type="text" bind:value="{textValue}" on:change="{parseTextValue}" on:focus="{inputFocused}" class="p-0.5 bg-white bg-opacity-0"/>
        <span class="absolute right-6 top-2 text-red-500 font-bold text-xs">{isHoliday(dateValue) ? "Week-end" : ""}</span>
        <button class="absolute right-0 top-0 p-1 rounded cursor-pointer border-opacity-0 border-2 border-blue-900 hover:border-opacity-100 hover:bg-blue-200" on:click="{openCalendar}"><Fa icon={faCalendarAlt}/></button>
        {#if tooltipVisible}
            <div class="tooltip" transition:fade="{{duration: 200}}">
                <p>Example of input:</p>
                <ul>
                    <tr><td>Today </td><td>0 or double-click</td></tr>
                    <tr><td>Full date </td><td>DD/MM/YYYY</td></tr>
                    <tr><td>Partial date </td><td>DD or <em>DD/MM</td></tr>
                    <tr><td>Diff. from today </td><td>+n or -n</td></tr>
                </ul>
            </div>
        {/if}
    </label>
    {#if calendarVisible}
        <div class="calendar text-xs absolute shadow-md bg-gray-50">
            <div class="inline-flex flex-col border-blue-900 border-2 rounded" transition:slide="{{duration: 200}}" on:introstart="{() => {calendarRenderFinished=false}}" on:introend="{() => {calendarRenderFinished=true}}"  use:clickOutside="{closeCalendar}">
                <div class="flex text-center bg-gray-50 px-1 p-0.5 border-b-2 border-blue-800">
                    <button class="calendarArrowButton" on:click="{() => {calendarMonth--;}}"><Fa icon={faChevronLeft}/></button>
                    <select bind:value="{calendarMonth}" class="text-center w-full">
                        {#each monthLabels as monthLabel, i}
                            <option class="text-center" value="{i}">{monthLabel}</option>
                        {/each}
                    </select>
                    <button class="calendarArrowButton" on:click="{() => {calendarMonth++;}}"><Fa icon={faChevronRight}/></button>
                    |
                    <button class="calendarArrowButton" on:click="{() => {calendarYear--;}}"><Fa icon={faChevronLeft}/></button>
                    <input class="text-center w-8 m-0" type="number" min="1900" max="2500" bind:value="{calendarYear}"/>
                    <button class="calendarArrowButton" on:click="{() => {calendarYear++;}}"><Fa icon={faChevronRight}/></button>
                </div>
                <div class="inline-grid grid-cols-7 gap-0 font-mono ">
                    {#each dayOfWeekLabels as dow, i} 
                        <div class="font-bold text-center w-6 p-0.5 bg-white {i >= 5 ? "text-red-500" : ""}">{dow[0]}</div>
                    {/each}
                    {#each calendarDates as date} 
                        <button on:click="{() => calendarDateSelected(date)}"
                            class="calendarDate
                            {isHoliday(date) ? "calendarHolidayDate" : "" }
                            { date.getMonth() !== calendarMonth ? "calendarPreviousMonthDate" : ""}
                            { date.getTime() === today.getTime() ? "calendarTodayDate" : ""}
                            { dateValue && dateValue.getTime() === date.getTime() ? "calendarSelectedDate" : ""}
                        " >    
                            {date.getDate()}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>