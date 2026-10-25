export function rangePlaceholder(min,max,unit='') {
 return `${min} to ${max}${unit ? ` ${unit}` : ''}`;
}
