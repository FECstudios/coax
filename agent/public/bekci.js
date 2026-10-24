// Otomatik üretildi: tasarım tuvalindeki Bekci.dc.html. Elle düzenleme yerine oradan yeniden üret.
export const MOODS = ["bekliyor","konusuyor","dusunuyor","reddetti","kandirildi"];
export function bekciSVG(mood, a = "#FFC93C") {
  switch (mood) {
    case "bekliyor": return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMax meet" viewBox="0 0 260 300" role="img" aria-label="Bekçi bekliyor: kollar kavuşturulmuş, ukala sırıtıyor">
  <ellipse cx="130" cy="294" rx="104" ry="7" fill="#000000" opacity="0.35"></ellipse>
  <rect x="16" y="68" width="16" height="34" rx="5" fill="#3E4A75" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="16" y="214" width="16" height="34" rx="5" fill="#3E4A75" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="24" y="30" width="212" height="260" rx="26" fill="#2A3456" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="38" y="44" width="184" height="232" rx="18" fill="#232C4A"></rect>
  <circle cx="50" cy="56" r="4" fill="#3E4A75"></circle><circle cx="210" cy="56" r="4" fill="#3E4A75"></circle><circle cx="50" cy="264" r="4" fill="#3E4A75"></circle><circle cx="210" cy="264" r="4" fill="#3E4A75"></circle>
  <circle cx="208" cy="168" r="17" fill="none" stroke="#56638F" stroke-width="6"></circle>
  <path d="M208 151 V185 M191 168 H225" stroke="#56638F" stroke-width="4" stroke-linecap="round"></path>
  <path d="M66 296 C66 226 92 204 130 202 C168 204 194 226 194 296 Z" fill="#2F4A8A" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M110 204 L130 222 L118 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M150 204 L130 222 L142 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M125 222 H135 L139 244 L130 254 L121 244 Z" fill="#C24A55" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M162 228 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1 z" fill="${a}" stroke="#0B1020" stroke-width="2.5" stroke-linejoin="round"></path>
  <rect x="72" y="256" width="116" height="30" rx="15" fill="#3B5AA3" stroke="#0B1020" stroke-width="4"></rect>
  <circle cx="82" cy="266" r="11" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <circle cx="178" cy="266" r="11" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <rect x="116" y="186" width="28" height="22" fill="#E3B086" stroke="#0B1020" stroke-width="4"></rect>
  <ellipse cx="76" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="184" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="130" cy="140" rx="56" ry="58" fill="#F4CDA5" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="96" cy="172" rx="10" ry="6" fill="#F09A8A" opacity="0.55"></ellipse>
  <ellipse cx="164" cy="172" rx="10" ry="6" fill="#F09A8A" opacity="0.55"></ellipse>
  <path d="M70 122 C66 74 94 52 130 50 C166 52 194 74 190 122 Z" fill="#17171C" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M130 52 V120 M100 60 C93 80 91 100 93 120 M160 60 C167 80 169 100 167 120" stroke="#2C2C36" stroke-width="2" fill="none"></path>
  <circle cx="130" cy="51" r="4.5" fill="#17171C" stroke="#0B1020" stroke-width="2.5"></circle>
  <rect x="124" y="62" width="12" height="12" rx="2.5" transform="rotate(45 130 68)" fill="none" stroke="#F4F1E8" stroke-width="3"></rect>
  <path d="M88 84 L98 89 C104 82 117 82 123 91 C117 100 104 101 98 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="111" cy="91.5" rx="7" ry="7.5" fill="#8C8FE0"></ellipse>
  <ellipse cx="111" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="114" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M98 89 C104 82 117 82 123 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M172 84 L162 89 C156 82 143 82 137 91 C143 100 156 101 162 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="149" cy="91.5" rx="7" ry="7.5" fill="#7CC46A"></ellipse>
  <ellipse cx="149" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="152" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M162 89 C156 82 143 82 137 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M86 104 q9 -3 18 -1 M88 110 q8 0 15 2 M174 104 q-9 -3 -18 -1 M172 110 q-8 0 -15 2" stroke="#F4F1E8" stroke-width="2.2" fill="none" stroke-linecap="round"></path>
  <path d="M122 105 q4 5 8 0 q4 5 8 0" stroke="#F4F1E8" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M66 120 C100 130 160 130 194 120 C201 124 201 134 192 139 C160 150 100 150 68 139 C59 134 59 124 66 120 Z" fill="#101014" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M98 149 q10 -3 20 0" stroke="#4A2F1E" stroke-width="6" fill="none" stroke-linecap="round"></path>
  <path d="M142 146 q10 -6 20 -1" stroke="#4A2F1E" stroke-width="6" fill="none" stroke-linecap="round"></path>
  <path d="M100 162 q9 -7 18 0" stroke="#0B1020" stroke-width="4.5" fill="none" stroke-linecap="round"></path>
  <path d="M142 162 q9 -7 18 0" stroke="#0B1020" stroke-width="4.5" fill="none" stroke-linecap="round"></path>
  <ellipse cx="130" cy="172" rx="10" ry="8" fill="#EBA983" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <path d="M118 193 q10 5 22 -3" stroke="#0B1020" stroke-width="4" fill="none" stroke-linecap="round"></path>
  <path d="M86 182 C96 170 116 170 130 178 C144 170 164 170 174 182 C178 188 172 192 166 188 C156 192 142 190 130 184 C118 190 104 192 94 188 C88 192 82 188 86 182 Z" fill="#4A2F1E" stroke="#0B1020" stroke-width="3.5" stroke-linejoin="round"></path>
</svg>`;
    case "konusuyor": return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMax meet" viewBox="0 0 260 300" role="img" aria-label="Bekçi konuşuyor: ağzı açık, tek kaşı havada">
  <ellipse cx="130" cy="294" rx="104" ry="7" fill="#000000" opacity="0.35"></ellipse>
  <rect x="16" y="68" width="16" height="34" rx="5" fill="#3E4A75" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="16" y="214" width="16" height="34" rx="5" fill="#3E4A75" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="24" y="30" width="212" height="260" rx="26" fill="#2A3456" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="38" y="44" width="184" height="232" rx="18" fill="#232C4A"></rect>
  <circle cx="50" cy="56" r="4" fill="#3E4A75"></circle><circle cx="210" cy="56" r="4" fill="#3E4A75"></circle><circle cx="50" cy="264" r="4" fill="#3E4A75"></circle><circle cx="210" cy="264" r="4" fill="#3E4A75"></circle>
  <circle cx="208" cy="168" r="17" fill="none" stroke="#56638F" stroke-width="6"></circle>
  <path d="M208 151 V185 M191 168 H225" stroke="#56638F" stroke-width="4" stroke-linecap="round"></path>
  <path d="M66 296 C66 226 92 204 130 202 C168 204 194 226 194 296 Z" fill="#2F4A8A" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M110 204 L130 222 L118 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M150 204 L130 222 L142 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M125 222 H135 L139 244 L130 254 L121 244 Z" fill="#C24A55" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M162 228 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1 z" fill="${a}" stroke="#0B1020" stroke-width="2.5" stroke-linejoin="round"></path>
  <rect x="72" y="256" width="116" height="30" rx="15" fill="#3B5AA3" stroke="#0B1020" stroke-width="4"></rect>
  <circle cx="82" cy="266" r="11" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <circle cx="178" cy="266" r="11" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <rect x="116" y="186" width="28" height="22" fill="#E3B086" stroke="#0B1020" stroke-width="4"></rect>
  <ellipse cx="76" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="184" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="130" cy="140" rx="56" ry="58" fill="#F4CDA5" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="96" cy="172" rx="10" ry="6" fill="#F09A8A" opacity="0.55"></ellipse>
  <ellipse cx="164" cy="172" rx="10" ry="6" fill="#F09A8A" opacity="0.55"></ellipse>
  <path d="M70 122 C66 74 94 52 130 50 C166 52 194 74 190 122 Z" fill="#17171C" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M130 52 V120 M100 60 C93 80 91 100 93 120 M160 60 C167 80 169 100 167 120" stroke="#2C2C36" stroke-width="2" fill="none"></path>
  <circle cx="130" cy="51" r="4.5" fill="#17171C" stroke="#0B1020" stroke-width="2.5"></circle>
  <rect x="124" y="62" width="12" height="12" rx="2.5" transform="rotate(45 130 68)" fill="none" stroke="#F4F1E8" stroke-width="3"></rect>
  <path d="M88 84 L98 89 C104 82 117 82 123 91 C117 100 104 101 98 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="111" cy="91.5" rx="7" ry="7.5" fill="#8C8FE0"></ellipse>
  <ellipse cx="111" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="114" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M98 89 C104 82 117 82 123 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M172 84 L162 89 C156 82 143 82 137 91 C143 100 156 101 162 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="149" cy="91.5" rx="7" ry="7.5" fill="#7CC46A"></ellipse>
  <ellipse cx="149" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="152" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M162 89 C156 82 143 82 137 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M86 104 q9 -3 18 -1 M88 110 q8 0 15 2 M174 104 q-9 -3 -18 -1 M172 110 q-8 0 -15 2" stroke="#F4F1E8" stroke-width="2.2" fill="none" stroke-linecap="round"></path>
  <path d="M122 105 q4 5 8 0 q4 5 8 0" stroke="#F4F1E8" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M66 120 C100 130 160 130 194 120 C201 124 201 134 192 139 C160 150 100 150 68 139 C59 134 59 124 66 120 Z" fill="#101014" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M98 149 q10 -2 20 1" stroke="#4A2F1E" stroke-width="6" fill="none" stroke-linecap="round"></path>
  <path d="M142 143 q10 -7 20 -2" stroke="#4A2F1E" stroke-width="6" fill="none" stroke-linecap="round"></path>
  <ellipse cx="109" cy="161" rx="9" ry="9" fill="#FFFFFF" stroke="#0B1020" stroke-width="3"></ellipse>
  <ellipse cx="151" cy="160" rx="9" ry="10" fill="#FFFFFF" stroke="#0B1020" stroke-width="3"></ellipse>
  <circle cx="111" cy="164" r="4" fill="#0B1020"></circle>
  <circle cx="153" cy="162" r="4" fill="#0B1020"></circle>
  <path d="M99 160 q10 -13 20 0 Z" fill="#F4CDA5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <ellipse cx="130" cy="172" rx="10" ry="8" fill="#EBA983" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <ellipse cx="130" cy="191" rx="10" ry="7" fill="#6B1F2A" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <ellipse cx="130" cy="194" rx="5" ry="2.5" fill="#E06C7A"></ellipse>
  <path d="M86 182 C96 170 116 170 130 178 C144 170 164 170 174 182 C178 188 172 192 166 188 C156 192 142 190 130 184 C118 190 104 192 94 188 C88 192 82 188 86 182 Z" fill="#4A2F1E" stroke="#0B1020" stroke-width="3.5" stroke-linejoin="round"></path>
  <path d="M206 98 q8 6 0 14 M216 92 q12 10 0 26" stroke="${a}" stroke-width="4" fill="none" stroke-linecap="round"></path>
</svg>`;
    case "dusunuyor": return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMax meet" viewBox="0 0 260 300" role="img" aria-label="Bekçi düşünüyor: gözler yukarıda, terliyor">
  <ellipse cx="130" cy="294" rx="104" ry="7" fill="#000000" opacity="0.35"></ellipse>
  <rect x="16" y="68" width="16" height="34" rx="5" fill="#3E4A75" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="16" y="214" width="16" height="34" rx="5" fill="#3E4A75" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="24" y="30" width="212" height="260" rx="26" fill="#2A3456" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="38" y="44" width="184" height="232" rx="18" fill="#232C4A"></rect>
  <circle cx="50" cy="56" r="4" fill="#3E4A75"></circle><circle cx="210" cy="56" r="4" fill="#3E4A75"></circle><circle cx="50" cy="264" r="4" fill="#3E4A75"></circle><circle cx="210" cy="264" r="4" fill="#3E4A75"></circle>
  <circle cx="208" cy="168" r="17" fill="none" stroke="#56638F" stroke-width="6"></circle>
  <path d="M208 151 V185 M191 168 H225" stroke="#56638F" stroke-width="4" stroke-linecap="round"></path>
  <path d="M66 296 C66 226 92 204 130 202 C168 204 194 226 194 296 Z" fill="#2F4A8A" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M110 204 L130 222 L118 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M150 204 L130 222 L142 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M125 222 H135 L139 244 L130 254 L121 244 Z" fill="#C24A55" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M162 228 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1 z" fill="${a}" stroke="#0B1020" stroke-width="2.5" stroke-linejoin="round"></path>
  <rect x="72" y="256" width="116" height="30" rx="15" fill="#3B5AA3" stroke="#0B1020" stroke-width="4"></rect>
  <circle cx="82" cy="266" r="11" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <circle cx="178" cy="266" r="11" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <rect x="116" y="186" width="28" height="22" fill="#E3B086" stroke="#0B1020" stroke-width="4"></rect>
  <ellipse cx="76" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="184" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="130" cy="140" rx="56" ry="58" fill="#F4CDA5" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="96" cy="172" rx="10" ry="6" fill="#F09A8A" opacity="0.55"></ellipse>
  <ellipse cx="164" cy="172" rx="10" ry="6" fill="#F09A8A" opacity="0.55"></ellipse>
  <path d="M70 122 C66 74 94 52 130 50 C166 52 194 74 190 122 Z" fill="#17171C" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M130 52 V120 M100 60 C93 80 91 100 93 120 M160 60 C167 80 169 100 167 120" stroke="#2C2C36" stroke-width="2" fill="none"></path>
  <circle cx="130" cy="51" r="4.5" fill="#17171C" stroke="#0B1020" stroke-width="2.5"></circle>
  <rect x="124" y="62" width="12" height="12" rx="2.5" transform="rotate(45 130 68)" fill="none" stroke="#F4F1E8" stroke-width="3"></rect>
  <path d="M88 84 L98 89 C104 82 117 82 123 91 C117 100 104 101 98 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="111" cy="91.5" rx="7" ry="7.5" fill="#8C8FE0"></ellipse>
  <ellipse cx="111" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="114" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M98 89 C104 82 117 82 123 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M172 84 L162 89 C156 82 143 82 137 91 C143 100 156 101 162 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="149" cy="91.5" rx="7" ry="7.5" fill="#7CC46A"></ellipse>
  <ellipse cx="149" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="152" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M162 89 C156 82 143 82 137 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M86 104 q9 -3 18 -1 M88 110 q8 0 15 2 M174 104 q-9 -3 -18 -1 M172 110 q-8 0 -15 2" stroke="#F4F1E8" stroke-width="2.2" fill="none" stroke-linecap="round"></path>
  <path d="M122 105 q4 5 8 0 q4 5 8 0" stroke="#F4F1E8" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M66 120 C100 130 160 130 194 120 C201 124 201 134 192 139 C160 150 100 150 68 139 C59 134 59 124 66 120 Z" fill="#101014" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M98 148 q10 -1 20 1" stroke="#4A2F1E" stroke-width="6" fill="none" stroke-linecap="round"></path>
  <path d="M142 143 q10 -8 20 -3" stroke="#4A2F1E" stroke-width="6" fill="none" stroke-linecap="round"></path>
  <ellipse cx="109" cy="161" rx="9" ry="10" fill="#FFFFFF" stroke="#0B1020" stroke-width="3"></ellipse>
  <ellipse cx="151" cy="161" rx="9" ry="10" fill="#FFFFFF" stroke="#0B1020" stroke-width="3"></ellipse>
  <circle cx="113" cy="156" r="4" fill="#0B1020"></circle>
  <circle cx="155" cy="156" r="4" fill="#0B1020"></circle>
  <ellipse cx="130" cy="172" rx="10" ry="8" fill="#EBA983" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <ellipse cx="138" cy="192" rx="4" ry="4" fill="#6B1F2A" stroke="#0B1020" stroke-width="3"></ellipse>
  <path d="M86 182 C96 170 116 170 130 178 C144 170 164 170 174 182 C178 188 172 192 166 188 C156 192 142 190 130 184 C118 190 104 192 94 188 C88 192 82 188 86 182 Z" fill="#4A2F1E" stroke="#0B1020" stroke-width="3.5" stroke-linejoin="round"></path>
  <path d="M192 128 q8 12 0 20 q-8 -8 0 -20 z" fill="#8EC5FF" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <circle cx="204" cy="46" r="6" fill="#E8ECF5" stroke="#0B1020" stroke-width="3"></circle>
  <circle cx="222" cy="26" r="11" fill="#E8ECF5" stroke="#0B1020" stroke-width="3"></circle>
  <text x="222" y="32" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="16" fill="#0B1020">?</text>
</svg>`;
    case "reddetti": return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMax meet" viewBox="0 0 260 300" role="img" aria-label="Bekçi reddediyor: kaşlar çatık, parmak sallıyor">
  <ellipse cx="130" cy="294" rx="104" ry="7" fill="#000000" opacity="0.35"></ellipse>
  <rect x="16" y="68" width="16" height="34" rx="5" fill="#3E4A75" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="16" y="214" width="16" height="34" rx="5" fill="#3E4A75" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="24" y="30" width="212" height="260" rx="26" fill="#2A3456" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="38" y="44" width="184" height="232" rx="18" fill="#232C4A"></rect>
  <circle cx="50" cy="56" r="4" fill="#3E4A75"></circle><circle cx="210" cy="56" r="4" fill="#3E4A75"></circle><circle cx="50" cy="264" r="4" fill="#3E4A75"></circle><circle cx="210" cy="264" r="4" fill="#3E4A75"></circle>
  <path d="M66 296 C66 226 92 204 130 202 C168 204 194 226 194 296 Z" fill="#2F4A8A" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M110 204 L130 222 L118 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M150 204 L130 222 L142 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M125 222 H135 L139 244 L130 254 L121 244 Z" fill="#C24A55" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M152 234 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1 z" fill="${a}" stroke="#0B1020" stroke-width="2.5" stroke-linejoin="round"></path>
  <rect x="72" y="256" width="86" height="30" rx="15" fill="#3B5AA3" stroke="#0B1020" stroke-width="4"></rect>
  <circle cx="82" cy="266" r="11" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <path d="M178 238 C200 232 212 206 208 176" stroke="#0B1020" stroke-width="30" fill="none" stroke-linecap="round"></path>
  <path d="M178 238 C200 232 212 206 208 176" stroke="#3B5AA3" stroke-width="22" fill="none" stroke-linecap="round"></path>
  <circle cx="208" cy="168" r="13" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <defs><filter id="bekciParmakBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.5"></feGaussianBlur></filter></defs>
  <g filter="url(#bekciParmakBlur)" aria-hidden="true">
    <circle cx="198" cy="159" r="5.5" fill="#F4CDA5" stroke="#0B1020" stroke-width="3"></circle>
    <circle cx="218" cy="159" r="5.5" fill="#F4CDA5" stroke="#0B1020" stroke-width="3"></circle>
    <rect x="203" y="132" width="11" height="34" rx="5.5" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></rect>
    <path d="M205 162 h7" stroke="#F4CDA5" stroke-width="4"></path>
  </g>
  <path d="M228 132 q8 12 0 26 M188 132 q-8 12 0 26" stroke="#9AA4BF" stroke-width="3.5" fill="none" stroke-linecap="round"></path>
  <rect x="116" y="186" width="28" height="22" fill="#E3B086" stroke="#0B1020" stroke-width="4"></rect>
  <ellipse cx="76" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="184" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="130" cy="140" rx="56" ry="58" fill="#F4CDA5" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="96" cy="172" rx="10" ry="6" fill="#F09A8A" opacity="0.55"></ellipse>
  <ellipse cx="164" cy="172" rx="10" ry="6" fill="#F09A8A" opacity="0.55"></ellipse>
  <path d="M70 122 C66 74 94 52 130 50 C166 52 194 74 190 122 Z" fill="#17171C" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M130 52 V120 M100 60 C93 80 91 100 93 120 M160 60 C167 80 169 100 167 120" stroke="#2C2C36" stroke-width="2" fill="none"></path>
  <circle cx="130" cy="51" r="4.5" fill="#17171C" stroke="#0B1020" stroke-width="2.5"></circle>
  <rect x="124" y="62" width="12" height="12" rx="2.5" transform="rotate(45 130 68)" fill="none" stroke="#F4F1E8" stroke-width="3"></rect>
  <path d="M88 84 L98 89 C104 82 117 82 123 91 C117 100 104 101 98 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="111" cy="91.5" rx="7" ry="7.5" fill="#8C8FE0"></ellipse>
  <ellipse cx="111" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="114" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M98 89 C104 82 117 82 123 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M172 84 L162 89 C156 82 143 82 137 91 C143 100 156 101 162 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="149" cy="91.5" rx="7" ry="7.5" fill="#7CC46A"></ellipse>
  <ellipse cx="149" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="152" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M162 89 C156 82 143 82 137 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M86 104 q9 -3 18 -1 M88 110 q8 0 15 2 M174 104 q-9 -3 -18 -1 M172 110 q-8 0 -15 2" stroke="#F4F1E8" stroke-width="2.2" fill="none" stroke-linecap="round"></path>
  <path d="M122 105 q4 5 8 0 q4 5 8 0" stroke="#F4F1E8" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M66 120 C100 130 160 130 194 120 C201 124 201 134 192 139 C160 150 100 150 68 139 C59 134 59 124 66 120 Z" fill="#101014" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M98 146 l20 7" stroke="#4A2F1E" stroke-width="6" stroke-linecap="round"></path>
  <path d="M162 146 l-20 7" stroke="#4A2F1E" stroke-width="6" stroke-linecap="round"></path>
  <ellipse cx="109" cy="162" rx="9" ry="8" fill="#FFFFFF" stroke="#0B1020" stroke-width="3"></ellipse>
  <ellipse cx="151" cy="162" rx="9" ry="8" fill="#FFFFFF" stroke="#0B1020" stroke-width="3"></ellipse>
  <circle cx="110" cy="163" r="4" fill="#0B1020"></circle>
  <circle cx="150" cy="163" r="4" fill="#0B1020"></circle>
  <ellipse cx="130" cy="172" rx="10" ry="8" fill="#EBA983" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <ellipse cx="130" cy="191" rx="11" ry="6" fill="#6B1F2A" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <path d="M86 182 C96 170 116 170 130 178 C144 170 164 170 174 182 C178 188 172 192 166 188 C156 192 142 190 130 184 C118 190 104 192 94 188 C88 192 82 188 86 182 Z" fill="#4A2F1E" stroke="#0B1020" stroke-width="3.5" stroke-linejoin="round"></path>
</svg>`;
    case "kandirildi": return `<svg width="100%" height="100%" preserveAspectRatio="xMidYMax meet" viewBox="0 0 260 300" role="img" aria-label="Bekçi kandırıldı: kasa açık, şapkası uçuyor, altınlar saçılıyor">
  <ellipse cx="130" cy="294" rx="110" ry="7" fill="#000000" opacity="0.35"></ellipse>
  <rect x="24" y="30" width="212" height="260" rx="26" fill="#2A3456" stroke="#0B1020" stroke-width="4"></rect>
  <rect x="38" y="44" width="184" height="232" rx="18" fill="#0B1020"></rect>
  <ellipse cx="130" cy="150" rx="80" ry="90" fill="${a}" opacity="0.16"></ellipse>
  <path d="M24 34 L2 50 L2 272 L24 288 Z" fill="#3E4A75" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <ellipse cx="62" cy="268" rx="26" ry="12" fill="${a}" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <ellipse cx="198" cy="268" rx="26" ry="12" fill="${a}" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <circle cx="54" cy="72" r="11" fill="${a}" stroke="#0B1020" stroke-width="3"></circle><circle cx="54" cy="72" r="6" fill="none" stroke="#B98A1E" stroke-width="2.5"></circle>
  <circle cx="212" cy="62" r="13" fill="${a}" stroke="#0B1020" stroke-width="3"></circle><circle cx="212" cy="62" r="7" fill="none" stroke="#B98A1E" stroke-width="2.5"></circle>
  <circle cx="44" cy="200" r="10" fill="${a}" stroke="#0B1020" stroke-width="3"></circle><circle cx="44" cy="200" r="5" fill="none" stroke="#B98A1E" stroke-width="2.5"></circle>
  <circle cx="218" cy="212" r="12" fill="${a}" stroke="#0B1020" stroke-width="3"></circle><circle cx="218" cy="212" r="6" fill="none" stroke="#B98A1E" stroke-width="2.5"></circle>
  <circle cx="232" cy="130" r="9" fill="${a}" stroke="#0B1020" stroke-width="3"></circle>
  <circle cx="30" cy="136" r="8" fill="${a}" stroke="#0B1020" stroke-width="3"></circle>
  <path d="M66 296 C66 226 92 204 130 202 C168 204 194 226 194 296 Z" fill="#2F4A8A" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M110 204 L130 222 L118 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M150 204 L130 222 L142 232 Z" fill="#E8ECF5" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M125 222 H135 L139 244 L130 254 L121 244 Z" fill="#C24A55" stroke="#0B1020" stroke-width="3" stroke-linejoin="round"></path>
  <path d="M162 228 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1 z" fill="${a}" stroke="#0B1020" stroke-width="2.5" stroke-linejoin="round"></path>
  <path d="M86 240 C70 224 72 204 84 190" stroke="#0B1020" stroke-width="30" fill="none" stroke-linecap="round"></path>
  <path d="M86 240 C70 224 72 204 84 190" stroke="#3B5AA3" stroke-width="22" fill="none" stroke-linecap="round"></path>
  <path d="M174 240 C190 224 188 204 176 190" stroke="#0B1020" stroke-width="30" fill="none" stroke-linecap="round"></path>
  <path d="M174 240 C190 224 188 204 176 190" stroke="#3B5AA3" stroke-width="22" fill="none" stroke-linecap="round"></path>
  <rect x="116" y="186" width="28" height="22" fill="#E3B086" stroke="#0B1020" stroke-width="4"></rect>
  <ellipse cx="76" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="184" cy="148" rx="11" ry="14" fill="#E9B990" stroke="#0B1020" stroke-width="4"></ellipse>
  <ellipse cx="130" cy="140" rx="56" ry="58" fill="#F4CDA5" stroke="#0B1020" stroke-width="4"></ellipse>
  <path d="M112 90 q6 -12 12 0 M128 86 q6 -12 12 0 M144 90 q6 -12 12 0" stroke="#4A2F1E" stroke-width="4" fill="none" stroke-linecap="round"></path>
  <circle cx="86" cy="180" r="12" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <circle cx="174" cy="180" r="12" fill="#F4CDA5" stroke="#0B1020" stroke-width="3.5"></circle>
  <g transform="translate(48 -46) rotate(-28 130 90)">
    <path d="M70 122 C66 74 94 52 130 50 C166 52 194 74 190 122 Z" fill="#17171C" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M130 52 V120 M100 60 C93 80 91 100 93 120 M160 60 C167 80 169 100 167 120" stroke="#2C2C36" stroke-width="2" fill="none"></path>
  <circle cx="130" cy="51" r="4.5" fill="#17171C" stroke="#0B1020" stroke-width="2.5"></circle>
  <rect x="124" y="62" width="12" height="12" rx="2.5" transform="rotate(45 130 68)" fill="none" stroke="#F4F1E8" stroke-width="3"></rect>
  <path d="M88 84 L98 89 C104 82 117 82 123 91 C117 100 104 101 98 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="111" cy="91.5" rx="7" ry="7.5" fill="#8C8FE0"></ellipse>
  <ellipse cx="111" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="114" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M98 89 C104 82 117 82 123 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M172 84 L162 89 C156 82 143 82 137 91 C143 100 156 101 162 96 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="1.5" stroke-linejoin="round"></path>
  <ellipse cx="149" cy="91.5" rx="7" ry="7.5" fill="#7CC46A"></ellipse>
  <ellipse cx="149" cy="91.5" rx="2.2" ry="5.5" fill="#17171C"></ellipse>
  <circle cx="152" cy="88" r="1.7" fill="#FFFFFF"></circle>
  <path d="M162 89 C156 82 143 82 137 91" stroke="#17171C" stroke-width="1.6" fill="none"></path>
  <path d="M86 104 q9 -3 18 -1 M88 110 q8 0 15 2 M174 104 q-9 -3 -18 -1 M172 110 q-8 0 -15 2" stroke="#F4F1E8" stroke-width="2.2" fill="none" stroke-linecap="round"></path>
  <path d="M122 105 q4 5 8 0 q4 5 8 0" stroke="#F4F1E8" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M66 120 C100 130 160 130 194 120 C201 124 201 134 192 139 C160 150 100 150 68 139 C59 134 59 124 66 120 Z" fill="#101014" stroke="#0B1020" stroke-width="4" stroke-linejoin="round"></path>
  </g>
  <path d="M60 64 l-12 -8 M66 50 l-8 -12" stroke="#9AA4BF" stroke-width="3.5" stroke-linecap="round"></path>
  <path d="M96 132 q12 -9 24 0" stroke="#4A2F1E" stroke-width="6" fill="none" stroke-linecap="round"></path>
  <path d="M140 132 q12 -9 24 0" stroke="#4A2F1E" stroke-width="6" fill="none" stroke-linecap="round"></path>
  <circle cx="108" cy="157" r="13" fill="#FFFFFF" stroke="#0B1020" stroke-width="3.5"></circle>
  <circle cx="152" cy="157" r="13" fill="#FFFFFF" stroke="#0B1020" stroke-width="3.5"></circle>
  <circle cx="108" cy="157" r="3.5" fill="#0B1020"></circle>
  <circle cx="152" cy="157" r="3.5" fill="#0B1020"></circle>
  <ellipse cx="130" cy="174" rx="10" ry="8" fill="#EBA983" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <ellipse cx="130" cy="191" rx="9" ry="8" fill="#6B1F2A" stroke="#0B1020" stroke-width="3.5"></ellipse>
  <path d="M90 180 C100 172 116 174 130 180 C144 174 160 172 170 180 C166 186 156 186 148 184 C140 186 134 186 130 184 C126 186 120 186 112 184 C104 186 94 186 90 180 Z" fill="#4A2F1E" stroke="#0B1020" stroke-width="3.5" stroke-linejoin="round"></path>
</svg>`;
    default: return bekciSVG("bekliyor", a);
  }
}
