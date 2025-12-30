/* v 1.0.0 */

function find_on(param1, param2, param3, param4) {
  if(param1 instanceof HTMLElement) {
    let el = param1, selectors = param2, type = param3, func = param4;
    let target_el = find(el, selectors);
    target_el.addEventListener(type, func);
    return target_el;
  }
  else {
    let selectors = param1, type = param2, func = param3;
    let target_el = find(selectors);
    target_el.addEventListener(type, func);
    return target_el;
  }
}
function find_all_on(param1, param2, param3, param4) {
  if(param1 instanceof HTMLElement) {
    let el = param1, selectors = param2, type = param3, func = param4;
    let target_els = find_all(el, selectors);
    target_els.forEach(target_el => target_el.addEventListener(type, func));
    return target_els;
  }
  else {
    let selectors = param1, type = param2, func = param3;
    let target_els = find_all(selectors);
    target_els.forEach(target_el => target_el.addEventListener(type, func));
    return target_els;
  }
}
function find_all_for_each(param1, param2, param3) {
  if(param1 instanceof HTMLElement) {
    let el = param1, selectors = param2, func = param3;
    let target_els = find_all(el, selectors);
    target_els.forEach(func);
    return target_els;
  }
  else {
    let selectors = param1, func = param2;
    let target_els = find_all(selectors);
    target_els.forEach(func);
    return target_els;
  }
}

function find_all(param1, param2) {
  if(typeof param1 == 'string') return document.querySelectorAll(param1);
  else return param1.querySelectorAll(param2);
}
function find(param1, param2) {
  if(typeof param1 == 'string') return document.querySelector(param1);
  else return param1.querySelector(param2);
}
function new_el_to_el(target_el, tag_str, param1, param2) {
  let el = new_el(tag_str, param1, param2);
  if(typeof target_el == "string") target_el = find(target_el);
  if(target_el) target_el.appendChild(el);
  return el;
}
function new_el(tag_str, param1, param2) {
  /* tagName id class */
  let id, class_list;
  if(tag_str.search('#') != -1) id = tag_str.match(/#[^\.]*/)[0].substr(1);
  class_list = tag_str.split('.').slice(1).filter(v=>v);
  let tagName = tag_str.match(/[^#\.]*/)[0];
  /* el產生 */
  let el = document.createElement(tagName);
  if(id) el.id = id;
  class_list.forEach(className => el.classList.add(className));
  if(is_attr(param1)) { set_content(param2); set_attr(param1); }
  else if(is_attr(param2)) { set_content(param1); set_attr(param2); }
  else set_content(param1);
  return el;
  /* function */
  function is_attr(param) {
    if(!param || param.constructor !== Object) return false;
    if(typeof param != 'object' || Array.isArray(param) || param instanceof HTMLElement) return false;
    if(!Object.keys(param).length) return false;
    return true;
  }
  function set_content(param) {
    if(param == null || param == undefined || param === false) return;
    else if(param instanceof HTMLElement) return el.appendChild(param);
    else if(param instanceof Node && param.nodeType == Node.TEXT_NODE) return el.appendChild(param);
    else if(typeof param == "string" || typeof param == "number") return el.innerText = param;
    else if(!Array.isArray(param)) return;
    param.forEach(sub_cnt => {
      if(sub_cnt instanceof HTMLElement) el.appendChild(sub_cnt);
      else if(sub_cnt instanceof Node && sub_cnt.nodeType == Node.TEXT_NODE) el.appendChild(sub_cnt);
    });
  }
  function set_attr(param) {
    Object.entries(param).forEach(([key, val]) => {
      if(val === true) el.setAttribute(key, '');
      else if(typeof val == 'number' || typeof val == 'string') el.setAttribute(key, val);
    });
  }
}