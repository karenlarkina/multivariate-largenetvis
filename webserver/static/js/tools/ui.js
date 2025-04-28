/**
 * Creates HTML with option tags.
 * The input array has to have structure [{option, value}]
 *
 * @param {JSON} options
 */
function getOptionsForSelect(options){
    let result = '';
    options.forEach(option => {
        result += `<option value="${option.value}">${option.name}</option>\n`;
    });
    return result;
}