# svelte-tw-fa
DatePicker component using svelte, tailwind and fontawesome.

Allows special input from keyboard/mouse and parse them to a date. Example:

- "0" or double-click => today
- "+5" or "-5" => five days after or before today
- "14" => 14th day of this month
- "14/01" => 14th of January of this year
- "20210114" or "14-01-2021" or ... (full date)
# Installation

```bash
npm install -D @jeanvt/svelte-tw-fa
```

# Usage

```html
<script>
 import DatePicker from '@jeanvt/svelte-tw-fa';
 let textValue;
 let dateValue;
</script>

<label  for="datepicker">Date: </label>
<DatePicker id="datepicker"  init="+6"
	    bind:textValue  bind:dateValue  tooltipEnabled
	    displayFormat="YYYY-MM-DD"
/>
<p>Selected:<br/>
(String) {textValue}<br/>
(Date) {dateValue}
</p> 
```
