window.addEventListener("load", async () => {
  search_type.addEventListener("change", search);
  search_keyword.addEventListener("input", search);
  post("get_basic_info").then(({basic_info}) => update_footer(basic_info));
  let res = await post("get_all_cards");
  res.cards.map(card_data => {
    let card_el = create_card(card_data);
    card_data.card_el = card_el;
  });
  update_search_type();
  onload_auto_search();
});

function onload_auto_search() {
  if(/^\#\d+$/.test(location.hash)) {
    let find_result = find(`#cards .card[cid="${location.hash}"]`);
    if(find_result) find_result.click();
  }
  else if(location.search) {
    decodeURI(location.search).replace(/^\?/, "").split("&").forEach(str => {
      let key = str.replace(/=.*$/, "");
      let val = str.replace(/^[^=]*=/, "");
      if(key == "t") {
        search_type.value = val;
        search_type.value = search_type.value || "";
      }
      if(key == "s") search_keyword.value = val;
    });
    search();
    if(cards.matches(".not_found")) {
      search_keyword.value = "";
      search();
    }
  }
}

function update_footer(basic_info) {
  if(!basic_info) return;
  footer.innerHTML = "";
  basic_info.footer_links.split("\n").forEach(link_str => {
    let [text, href] = link_str.split(/\(|\)/).filter(v => v);
    new_el_to_el(footer, "a", {target: "_blank", href}, text);
  });
  let date = timestamp_to_date_str(basic_info.update_timestamp);
  new_el_to_el(footer, "div", `最後更新時間：${date}`);
}

function timestamp_to_date_str(timestamp) {
  let nd = new Date(timestamp);
  return [
    nd.getFullYear().toString().padStart(4, "0"),
    (nd.getMonth() + 1).toString().padStart(2, "0"),
    nd.getDate().toString().padStart(2, "0"),
  ].join("-");
}

function update_search_type() {
  search_type.innerHTML = "";
  let type_list = [];
  [...cards.children].forEach(card_el => {
    if(["混合", "補充"].includes(card_el.data.type)) return;
    if(!type_list.includes(card_el.data.type)) type_list.push(card_el.data.type);
  });
  new_el_to_el(search_type, "option", {value: ""}, "全部");
  type_list.forEach(type_name => {
    new_el_to_el(search_type, "option", {value: type_name}, type_name);
  });
}

function get_search_data() {
  if(/^#\d+$/.test(search_keyword.value.trim())) {
    return {id: +search_keyword.value.trim().substr(1)};
  }
  let type = search_type.value || null;
  let tags = search_keyword.value.match(/\[[^\[\]]+\]/g) || [];
  let keyword_str = search_keyword.value;
  tags.forEach(tag => keyword_str = keyword_str.replace(tag, " "));
  let keyword_arr = [];
  keyword_str.split(/\s/g).forEach(str => {
    if(str.trim()) keyword_arr.push(str.trim().toLowerCase());
  });
  tags = tags.map(str => str.replace(/^\[|]$/g, ""));
  return {type, tags, keyword_arr};
}
function search_check_card(card_data, search_data) {
  if(!search_data) return true;
  let {type, tags, keyword_arr, id} = search_data;
  if(id) return card_data.id == id;
  if(card_data.type == "補充") return false;
  let result = true;
  if(type) {
    if(card_data.type == "混合") result = result && card_data.tags.includes(type);
    else result = result && (card_data.type == type);
  }
  if(tags.length) {
    let has_tag = 0;
    tags.forEach(tag => has_tag += card_data.tags.includes(tag));
    result = result && !!has_tag;
  }
  if(keyword_arr.length) {
    let has_keyword = 0;
    for(let keyword of keyword_arr) {
      has_keyword += !!card_data.title.toLowerCase().includes(keyword);
      has_keyword += !!card_data.name.toLowerCase().includes(keyword);
      card_data.content.forEach(([cnt_type, cnt]) => {
        if(!["text", "code", "links"].includes(cnt_type)) return;
        has_keyword += !!cnt.toLowerCase().includes(keyword);
      });
      if(has_keyword) break;
    }
    result = result && !!has_keyword;
  }
  return result;
}
function search_update_href() {
  if(!search_type.value && !search_keyword.value) {
    history.replaceState(null, "", location.href.replace(/\?.*|\#.*/g, ""));
    return;
  }
  if(/^\#\d+$/.test(search_keyword.value)) {
    history.replaceState(null, "", location.href.replace(/\?.*|\#.*/g, "") + search_keyword.value);
    return;
  }
  let search_arr = [];
  if(search_type.value) search_arr.push("t=" + search_type.value);
  if(search_keyword.value) search_arr.push("s=" + search_keyword.value);
  history.replaceState(null, "", location.href.replace(/\?.*|\#.*/g, "") + "?" + search_arr.join("&"));
}
function search() {
  search_update_href();
  let search_data = get_search_data();
  [...cards.children].forEach(card_el => {
    let result = search_check_card(card_el.data, search_data);
    card_el.classList.toggle("hidden", !result);
  });
  let has_result = !!find(cards, ".card:not(.hidden)");
  cards.classList.toggle("not_found", !has_result);
}

function create_card(card_data) {
  let card_el = new_el_to_el(cards, "div.card", {
    cid: "#" + card_data.id,
  }, [
    new_el("div.type", card_data.type || "其他"),
    new_el("div.name", card_data.name || "unknown"),
    new_el("div.date", card_data.timestamp ? timestamp_to_date_str(card_data.timestamp) : "--"),
    new_el("div.title", card_data.title || "未命名的問題"),
    new_el("img", {src: card_data.img}),
    create_card_tags_el(card_data.tags),
    new_el("div.id", card_data.id || "--"),
  ]);
  card_el.addEventListener("click", ({target}) => {
    if(target.matches(".tag")) return;
    open_card(card_data);
  });
  Object.defineProperty(card_el, "data", { get: () => card_data });
  return card_el;
}
function create_card_tags_el(tags) {
  let tags_el = new_el("div.tags");
  tags.filter(v => v).forEach(tag_str => {
    tag_str = String(tag_str);
    let tag_el = new_el_to_el(tags_el, "div.tag", tag_str);
    tag_el.addEventListener("click", () => {
      search_keyword.value += `[${tag_str}]`;
      search();
    });
  });
  return tags_el;
}

function open_card(card_data) {
  find(card_content, ".title").innerText = card_data.title;

  let bottom_el = find(card_content, ".bottom");
  bottom_el.innerHTML = "";
  if(card_data.link) new_el_to_el(bottom_el, "a", {
    target: "_blank",
    href: card_data.link,
  }, "原問題位置");

  let cnt_el = find(card_content, ".content");
  cnt_el.innerHTML = "";
  card_data.content.forEach(([cnt_type, content]) => {
    if(cnt_type == "code") {
      let code_el = new_el_to_el(cnt_el, "div.code_holder", [
        new_el("button.copy_btn"),
        new_el("div.cnt", content),
      ]);
      find(code_el, ".copy_btn").addEventListener("click", () => copy(content));
    }
    else if(cnt_type == "h3") {
      new_el_to_el(cnt_el, "h3", content);
    }
    else if(cnt_type == "text") {
      new_el_to_el(cnt_el, "div.text", content);
    }
    else if(cnt_type == "img") {
      new_el_to_el(cnt_el, "img", {src: content});
    }
    else if(cnt_type == "links") {
      new_el_to_el(cnt_el, "div.links", content.split("\n").map(link_str => {
        let [text, href] = link_str.split(/\(|\)/).filter(v => v);
        return new_el("a", {target: "_blank", href}, text);
      }));
    }
    else if(cnt_type == "hr") {
      new_el_to_el(cnt_el, "hr");
    }
  });
  card_content.classList.remove("hidden");
}
window.addEventListener("load", () => {
  card_content.addEventListener("click", ({target}) => {
    if(target == card_content) card_content.classList.add("hidden");
  });
  find(card_content, ".close_btn").addEventListener("click", () => {
    card_content.classList.add("hidden");
  });
});

function copy(content) {
  copy_el.value = content;
  copy_el.select();
  document.execCommand("copy");
}
