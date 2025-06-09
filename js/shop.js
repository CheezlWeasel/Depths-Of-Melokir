import {RenderItems} from "./render-items.js";

class ShopSublistManager extends SublistManager {
	constructor () {
		super({
			sublistListOptions: {
				fnSort: PageFilterItems.sortItems,
			},
			isSublistItemsCountable: true,
		});

		this._sublistCurrencyConversion = null;
		this._sublistCurrencyDisplayMode = null;

		this._$totalWeight = null;
		this._$totalValue = null;
		this._$totalItems = null;
	}

	async pCreateSublist () {
		[this._sublistCurrencyConversion, this._sublistCurrencyDisplayMode] = await Promise.all([
			StorageUtil.pGetForPage("sublistCurrencyConversion"),
			StorageUtil.pGetForPage("sublistCurrencyDisplayMode"),
		]);

		return super.pCreateSublist();
	}

	static _getRowTemplate () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold ve-col-6 pl-0 pr-1",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Weight",
				css: "ve-text-center ve-col-2 px-1",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Cost",
				css: "ve-text-center ve-col-2 px-1",
				colStyle: "text-center",
			}),
			new SublistCellTemplate({
				name: "Number",
				css: "ve-text-center ve-col-2 pl-1 pr-0",
				colStyle: "text-center",
			}),
		];
	}

	pGetSublistItem (item, hash, {count = 1} = {}) {
		const cellsText = [
			item.name,
			item._l_weight || "\u2014",
			item._l_value,
		];

		const $dispCount = $(`<span class="ve-text-center ve-col-2 pr-0">${count}</span>`);
		const $ele = $$`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="lst__row-border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText, templates: this.constructor._ROW_TEMPLATE.slice(0, 3)})}
				${$dispCount}
			</a>
		</div>`
			.contextmenu(evt => this._handleSublistItemContextMenu(evt, listItem))
			.click(evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			$ele,
			item.name,
			{
				hash,
				source: Parser.sourceJsonToAbv(item.source),
				page: item.page,
				weight: Parser.weightValueToNumber(item.weight),
				cost: item.value || 0,
			},
			{
				count,
				$elesCount: [$dispCount],
				entity: item,
				mdRow: [...cellsText, ({listItem}) => listItem.data.count],
			},
		);
		return listItem;
	}

	_onSublistChange () {
		this._$totalWeight = this._$totalWeight || $(`#totalweight`);
		this._$totalValue = this._$totalValue || $(`#totalvalue`);
		this._$totalItems = this._$totalItems || $(`#totalitems`);

		let weight = 0;
		let value = 0;
		let cntItems = 0;

		const availConversions = new Set();
		this._listSub.items.forEach(it => {
			const {data: {entity: item}} = it;
			if (item.currencyConversion) availConversions.add(item.currencyConversion);
			const count = it.data.count;
			cntItems += it.data.count;
			if (item.weight) weight += Number(item.weight) * count;
			if (item.value) value += item.value * count;
		});

		this._$totalWeight.text(Parser.itemWeightToFull({weight}, true));
		this._$totalItems.text(cntItems);

		if (availConversions.size) {
			this._$totalValue
				.text(Parser.itemValueToFullMultiCurrency({value, currencyConversion: this._sublistCurrencyConversion}))
				.off("click")
				.click(async () => {
					const values = ["(Default)", ...[...availConversions].sort(SortUtil.ascSortLower)];
					const defaultSel = values.indexOf(this._sublistCurrencyConversion);
					const userSel = await InputUiUtil.pGetUserEnum({
						values,
						isResolveItem: true,
						default: ~defaultSel ? defaultSel : 0,
						title: "Select Currency Conversion Table",
						fnDisplay: it => it === null ? values[0] : it,
					});
					if (userSel == null) return;
					this._sublistCurrencyConversion = userSel === values[0] ? null : userSel;
					await StorageUtil.pSetForPage("sublistCurrencyConversion", this._sublistCurrencyConversion);
					this._onSublistChange();
				});
			return;
		}

		this._$totalValue
			.text(this._getTotalValueText({value}) || "\u2014")
			.off("click")
			.click(async () => {
				const defaultSel = this.constructor._TOTAL_VALUE_MODES.indexOf(this._sublistCurrencyDisplayMode);
				const userSel = await InputUiUtil.pGetUserEnum({
					values: this.constructor._TOTAL_VALUE_MODES,
					isResolveItem: true,
					default: ~defaultSel ? defaultSel : 0,
					title: "Select Display Mode",
					fnDisplay: it => it === null ? this.constructor._TOTAL_VALUE_MODES[0] : it,
				});
				if (userSel == null) return;
				this._sublistCurrencyDisplayMode = userSel === this.constructor._TOTAL_VALUE_MODES[0] ? null : userSel;
				await StorageUtil.pSetForPage("sublistCurrencyDisplayMode", this._sublistCurrencyDisplayMode);
				this._onSublistChange();
			});
	}

	static _TOTAL_VALUE_MODE_EXACT_COINAGE = "Exact Coinage";
	static _TOTAL_VALUE_MODE_LOWEST_COMMON = "Lowest Common Currency";
	static _TOTAL_VALUE_MODE_GOLD = "Gold";
	static _TOTAL_VALUE_MODES = [
		this._TOTAL_VALUE_MODE_EXACT_COINAGE,
		this._TOTAL_VALUE_MODE_LOWEST_COMMON,
		this._TOTAL_VALUE_MODE_GOLD,
	];
	_getTotalValueText ({value}) {
		switch (this._sublistCurrencyDisplayMode) {
			case this.constructor._TOTAL_VALUE_MODE_LOWEST_COMMON: return Parser.itemValueToFull({value});

			case this.constructor._TOTAL_VALUE_MODE_GOLD: {
				return value ? `${Number((Parser.DEFAULT_CURRENCY_CONVERSION_TABLE.find(it => it.coin === "gp").mult * value).toFixed(2))} gp` : "";
			}

			default: {
				const CURRENCIES = ["gp", "sp", "cp"];
				const coins = {cp: value};
				CurrencyUtil.doSimplifyCoins(coins);
				return CURRENCIES.filter(it => coins[it]).map(it => `${coins[it].toLocaleString(undefined, {maximumFractionDigits: 5})} ${it}`).join(", ");
			}
		}
	}
}

class Shop {
	static _loadedRawJson = null;
	static _pLoadingRawJson = null;

	static async loadRawJSON () {
		if (this._loadedRawJson) return this._loadedRawJson;
		if (this._pLoadingRawJson) return this._pLoadingRawJson;

		this._pLoadingRawJson = (async () => {
			const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/shop.json`);
			const baseItemsData = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/shop-base.json`);
			const magicVariantsData = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/shopmagicvariants.json`);

			let brewBaseItems = [];
			let brewMagicVariants = [];
			let brewShopItems = [];
			if (typeof BrewUtil2 !== "undefined" && BrewUtil2.pGetBrewProcessed) {
				const brew = await BrewUtil2.pGetBrewProcessed();
				brewBaseItems = brew.baseitem || [];
				brewMagicVariants = brew.magicvariant || [];
				brewShopItems = brew.shop || [];
			}

			this._loadedRawJson = {
				shop: MiscUtil.copyFast([...(data.shop || []), ...brewShopItems]),
				baseitem: [...(baseItemsData.baseitem || []), ...brewBaseItems],
				magicvariant: [...(magicVariantsData.magicvariant || []), ...brewMagicVariants],
			};
			return this._loadedRawJson;
		})();
		return this._pLoadingRawJson;
	}

	static async getAllBaseItems() {
		const raw = await this.loadRawJSON();
		return raw.baseitem || [];
	}

	static async getAllMagicVariants() {
		const raw = await this.loadRawJSON();
		return raw.magicvariant || [];
	}

	static async loadJSON () {
		const data = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/shop.json`);
		return { shop: data.shop };
	}

	static async loadPrerelease () {
		const items = (await Renderer.item.pGetShopItemsFromPrerelease?.()) || [];
		return { shop: items };
	}

	static async loadBrew () {
		const items = (await Renderer.item.pGetShopItemsFromBrew?.()) || [];
		return { shop: items };
	}

	// --- Custom loader to expand magic variants before passing to ListPage ---
	static async loadShopDataWithVariants() {
		const raw = await Shop.loadRawJSON();
		const baseItems = raw.baseitem || [];
		const magicVariants = raw.magicvariant || [];
		let shop = raw.shop || [];

		// Expand magic variants (specific variants)
		const expandedVariants = await Renderer.item.getAllIndexableItems(
			{ magicvariant: magicVariants },
			{ magicvariant: magicVariants, baseitem: baseItems }
		);
		const existing = new Set(shop.map(it => `${it.name}|${it.source}`));

		// Add all specific variants
		for (const variant of expandedVariants || []) {
			const key = `${variant.name}|${variant.source}`;
			if (!existing.has(key)) {
				shop.push(variant);
				existing.add(key);
			}
		}

		// Add generic variant entries, each with a list of its specific variants
		for (const generic of magicVariants) {
			const key = `${generic.name}|${generic.source || generic.inherits?.source || "HB"}`;
			if (!existing.has(key)) {
				// Find all specific variants for this generic
				const specifics = (expandedVariants || []).filter(v => v.genericVariant && v.genericVariant.name === generic.name && v.genericVariant.source === (generic.source || generic.inherits?.source));
				const genericWithList = {
					...generic,
					_specificVariants: specifics,
					isGenericVariant: true,
				};
				shop.push(genericWithList);
				existing.add(key);
			}
		}

		// Optionally merge base items as well, if not already present
		for (const baseItem of baseItems) {
			const key = `${baseItem.name}|${baseItem.source}`;
			if (!existing.has(key)) {
				shop.push(baseItem);
				existing.add(key);
			}
		}

		return { shop };
	}

	static async loadShopData () {
		const raw = await this.loadRawJSON();
		return { shop: raw.shop };
	}

	static async loadShopDataWithVariantsAndBrew () {
		const raw = await this.loadRawJSON();
		const baseItems = raw.baseitem || [];
		const magicVariants = raw.magicvariant || [];
		let shop = raw.shop || [];

		// Expand magic variants
		const expandedVariants = await Renderer.item.getAllIndexableItems(
			magicVariants,
			{ magicvariant: magicVariants, baseitem: baseItems }
		);
		const existing = new Set(shop.map(it => `${it.name}|${it.source}`));
		for (const variant of expandedVariants) {
			const key = `${variant.name}|${variant.source}`;
			if (!existing.has(key)) {
				shop.push(variant);
				existing.add(key);
			}
		}

		// Optionally merge base items as well, if not already present
		for (const baseItem of baseItems) {
			const key = `${baseItem.name}|${baseItem.source}`;
			if (!existing.has(key)) {
				shop.push(baseItem);
				existing.add(key);
			}
		}

		let brewItems = [];
		if (typeof BrewUtil2 !== "undefined" && BrewUtil2.pGetBrewProcessed) {
			const brew = await BrewUtil2.pGetBrewProcessed();
			brewItems = brew.baseitem || [];
		}

		return { shop: [...shop, ...brewItems] };
	}
}
globalThis.Shop = Shop

class ShopPage extends ListPage {
	constructor () {
		// Load all shop-related data, including baseitem and magicvariant
		Shop.loadRawJSON().then(raw => {
			this._baseItems = raw.baseitem || [];
			this._magicVariants = raw.magicvariant || [];
		});
		Renderer.item.pPopulatePropertyAndTypeReference(Shop.loadJSON());
		const pFnGetFluff = Renderer.item.pGetFluff.bind(Renderer.item);
		super({
			dataSource: Shop.loadShopDataWithVariants,
			prereleaseDataSource: Shop.loadPrerelease.bind(Shop),
			brewDataSource: Shop.loadBrew.bind(Shop),

			pFnGetFluff,

			pageFilter: new PageFilterItems(),

			dataProps: ["shop"],

			bookViewOptions: {
				namePlural: "items",
				pageTitle: "Items Book View",
				propMarkdown: "shop",
			},

			tableViewOptions: {
				title: "Items",
				colTransforms: {
					name: UtilsTableview.COL_TRANSFORM_NAME,
					source: UtilsTableview.COL_TRANSFORM_SOURCE,
					page: UtilsTableview.COL_TRANSFORM_PAGE,
					rarity: {name: "Rarity"},
					_type: {name: "Type", transform: it => [it._typeHtml || "", it._subTypeHtml || ""].filter(Boolean).join(", ")},
					_attunement: {name: "Attunement", transform: it => it._attunement ? it._attunement.slice(1, it._attunement.length - 1) : ""},
					_damage: {name: "Damage", transform: it => Renderer.item.getRenderedDamageAndProperties(it)[0]},
					_properties: {name: "Properties", transform: it => Renderer.item.getRenderedDamageAndProperties(it)[1]},
					_mastery: {name: "Mastery", transform: it => Renderer.item.getRenderedMastery(it)},
					_weight: {name: "Weight", transform: it => Parser.itemWeightToFull(it)},
					_value: {name: "Value", transform: it => Parser.itemValueToFullMultiCurrency(it)},
					_entries: {name: "Text", transform: (it) => Renderer.item.getRenderedEntries(it, {isCompact: true}), flex: 3},
				},
			},
			propEntryData: "shop",

			listSyntax: new ListSyntaxItems({fnGetDataList: () => this._dataList, pFnGetFluff}),
		});

		this._mundaneList = null;
		this._magicList = null;
	}

	get _bindOtherButtonsOptions () {
		return {
			other: [
				this._bindOtherButtonsOptions_openAsSinglePage({slugPage: "items", fnGetHash: () => Hist.getHashParts()[0]}),
			].filter(Boolean),
		};
	}

	get primaryLists () { return [this._mundaneList, this._magicList]; }

	getListItem (item, itI, isExcluded) {
		// Ensure every item has a source property
		if (!item.source) item.source = "DepthsofMelokir";
		const hash = UrlUtil.autoEncodeHash(item);

		if (Renderer.item.isExcluded(item, {hash})) return null;
		if (item.noDisplay) return null;
		Renderer.item.enhanceItem(item);
		this._pageFilter.mutateAndAddToFilters(item, isExcluded);

		const source = Parser.sourceJsonToAbv(item.source);
		const type = item._typeListText.join(", ").toTitleCase();

		if (item._fIsMundane) {
			const eleLi = e_({
				tag: "div",
				clazz: `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`,
				click: (evt) => this._mundaneList.doSelect(listItem, evt),
				contextmenu: (evt) => this._openContextMenu(evt, this._mundaneList, listItem),
				children: [
					e_({
						tag: "a",
						href: `#${hash}`,
						clazz: "lst__row-border lst__row-inner",
						children: [
							e_({tag: "span", clazz: `ve-col-3-5 pl-0 pr-1 bold`, text: item.name}),
							e_({tag: "span", clazz: `ve-col-4-5 px-1`, text: type}),
							e_({tag: "span", clazz: `ve-col-1-5 px-1 ve-text-center`, text: item._l_value}),
							e_({tag: "span", clazz: `ve-col-1-5 px-1 ve-text-center`, text: item.seller}),
							e_({
								tag: "span",
								clazz: `ve-col-1 ve-text-center ${Parser.sourceJsonToSourceClassname(item.source)} pl-1 pr-0`,
								style: Parser.sourceJsonToStylePart(item.source),
								title: `${Parser.sourceJsonToFull(item.source)}${Renderer.utils.getSourceSubText(item)}`,
								text: source,
							}),
						],
					}),
				],
			});

			const listItem = new ListItem(
				itI,
				eleLi,
				item.name,
				{
					hash,
					source,
					page: item.page,
					type,
					cost: item.value || 0,
					weight: Parser.weightValueToNumber(item.weight),
				},
				{
					isExcluded,
				},
			);

			return {mundane: listItem};
		} else {
			const eleLi = e_({
				tag: "div",
				clazz: `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`,
				click: (evt) => this._magicList.doSelect(listItem, evt),
				contextmenu: (evt) => this._openContextMenu(evt, this._magicList, listItem),
				children: [
					e_({
						tag: "a",
						href: `#${hash}`,
						clazz: "lst__row-border lst__row-inner",
						children: [
							e_({tag: "span", clazz: `ve-col-3-5 pl-0 bold`, text: item.name}),
							e_({tag: "span", clazz: `ve-col-4`, text: type}),
							e_({tag: "span", clazz: `ve-col-1-5 ve-text-center`, text: item._l_value}),
							e_({tag: "span", clazz: `ve-col-1-5 ve-text-center`, text: item.seller}),
							e_({tag: "span", clazz: `ve-col-0-6 ve-text-center`, text: item._attunementCategory !== VeCt.STR_NO_ATTUNEMENT ? "×" : ""}),
							e_({
								tag: "span",
								clazz: `ve-col-1-4 ve-text-center ${item.rarity ? `itm__rarity-${item.rarity}` : ""}`,
								title: (item.rarity || "").toTitleCase(),
								text: Parser.itemRarityToShort(item.rarity) || "",
							}),
							e_({
								tag: "span",
								clazz: `ve-col-1 ve-text-center ${Parser.sourceJsonToSourceClassname(item.source)} pr-0`,
								style: Parser.sourceJsonToStylePart(item.source),
								title: `${Parser.sourceJsonToFull(item.source)}${Renderer.utils.getSourceSubText(item)}`,
								text: source,
							}),
						],
					}),
				],
			});

			const listItem = new ListItem(
				itI,
				eleLi,
				item.name,
				{
					hash,
					source,
					page: item.page,
					type,
					rarity: item.rarity,
					cost: item.value || 0,
					attunement: item._attunementCategory !== VeCt.STR_NO_ATTUNEMENT,
					weight: Parser.weightValueToNumber(item.weight),
				},
			);

			return {magic: listItem};
		}
	}

	handleFilterChange () {
		const f = this._pageFilter.filterBox.getValues();
		const listFilter = li => this._pageFilter.toDisplay(f, this._dataList[li.ix]);
		this._mundaneList.filter(listFilter);
		this._magicList.filter(listFilter);
		FilterBox.selectFirstVisible(this._dataList);
	}

	_tabTitleStats = "Item";

	_renderStats_doBuildStatsTab ({ent}) {
		this._$pgContent.empty();
		if (ent.isGenericVariant && ent._specificVariants?.length) {
			const [ptDamage, ptProperties] = Renderer.item.getRenderedDamageAndProperties(ent);
			const ptMastery = Renderer.item.getRenderedMastery(ent);
			const [typeRarityText, subTypeText, tierText] = Renderer.item.getTypeRarityAndAttunementText(ent);

			const textLeft = [Parser.itemValueToFullMultiCurrency(ent), Parser.itemWeightToFull(ent)].filter(Boolean).join(", ").uppercaseFirst();
			const textRight = [ptDamage, ptProperties, ptMastery]
				.filter(Boolean)
				.map(pt => `<div class=\"ve-text-wrap-balance ve-text-right\">${pt.uppercaseFirst()}</div>`)
				.join("");

			const trTextLeftRight = textLeft && textRight
				? `<tr><td colspan=\"2\">${textLeft}</td><td class=\"ve-text-right\" colspan=\"4\">${textRight}</td></tr>`
				: `<tr><td colspan=\"6\">${textLeft || textRight}</td></tr>`;

			const hrRow = `<tr><td colspan=\"6\"><div class="ve-tbl-divider"></div></td></tr>`;

			// Render description in correct font, and base item list outside
			const renderedText = Renderer.item.getRenderedEntries(ent);
			const descRow = renderedText ? `<tr><td colspan=\"6\"><div class=\"rd__desc mb-2\">${renderedText}</div></td></tr>` : "";

			const $listHeader = `<span class=\"rd__subtitle bold\">Base items.</span> This item variant can be applied to the following base items:`;
			const $ul = [];
			for (const variant of ent._specificVariants) {
				const hash = UrlUtil.autoEncodeHash(variant);
				const variantSource = variant.source || (variant.genericVariant && variant.genericVariant.source) || "";
				// --- Get base item info ---
				let baseName = variant.genericVariant?.baseName || variant._baseName || variant.baseName;
				let baseSource = variant.genericVariant?.baseSource || variant._baseSource || variant.baseSource;
				if (!baseName && variant.genericVariant && variant.genericVariant.name !== variant.name) {
					const gen = variant.genericVariant;
					if (gen.inherits?.namePrefix && variant.name.startsWith(gen.inherits.namePrefix)) {
						baseName = variant.name.slice(gen.inherits.namePrefix.length);
					} else if (gen.inherits?.nameSuffix && variant.name.endsWith(gen.inherits.nameSuffix)) {
						baseName = variant.name.slice(0, -gen.inherits.nameSuffix.length);
					}
				}
				if (!baseName) baseName = variant.name;
				if (!baseSource) baseSource = variant._baseSource || variant.baseSource || variant.source;
				// --- Build base item hash ---
				let baseHash = null;
				if (variant.baseItem) {
					// baseItem is usually in the form "name|source"
					const [bName, bSource] = variant.baseItem.split("|");
					baseHash = UrlUtil.autoEncodeHash({name: bName || baseName, source: bSource || baseSource});
					baseSource = bSource || baseSource;
				} else if (baseName && baseSource) {
					baseHash = UrlUtil.autoEncodeHash({name: baseName, source: baseSource});
				}
				// --- Render base item link ---
				const baseItemLink = baseHash ?
					`<a href=\"shop.html#${baseHash}\" onmouseover=\"Renderer.hover.pHandleLinkMouseOver(event, this)\" onmouseleave=\"Renderer.hover.handleLinkMouseLeave(event, this)\" onmousemove=\"Renderer.hover.handleLinkMouseMove(event, this)\" onclick=\"Renderer.hover.handleLinkClick(event, this)\" ondragstart=\"Renderer.hover.handleLinkDragStart(event, this)\" data-vet-page=\"shop.html\" data-vet-source=\"${baseSource}\" data-vet-hash=\"${baseHash}\" ontouchstart=\"Renderer.hover.handleTouchStart(event, this)\">${baseName}</a>`
					: `<span>${baseName}</span>`;
				// --- Render variant link ---
				const variantLink = `<a href=\"shop.html#${hash}\" onmouseover=\"Renderer.hover.pHandleLinkMouseOver(event, this)\" onmouseleave=\"Renderer.hover.handleLinkMouseLeave(event, this)\" onmousemove=\"Renderer.hover.handleLinkMouseMove(event, this)\" onclick=\"Renderer.hover.handleLinkClick(event, this)\" ondragstart=\"Renderer.hover.handleLinkDragStart(event, this)\" data-vet-page=\"shop.html\" data-vet-source=\"${variantSource}\" data-vet-hash=\"${hash}\" ontouchstart=\"Renderer.hover.handleTouchStart(event, this)\">${variant.name}</a>`;
				$ul.push(`<li class=\"rd-item__variant-list-item mb-0\">${baseItemLink} (${variantLink}) <span class=\"ve-muted\">(${Parser.sourceJsonToAbv(variant.source)})</span></li>`);
			}
			const listRow = `<tr><td colspan=\"6\">${$listHeader}<div class=\"rd-item__variant-list-wrap mb-2\"><ul class=\"rd-item__variant-list pl-3\">${$ul.join("")}</ul></div></td></tr>`;

			const $tbl = $(
				`<table class=\"w-100 stats rd-item__tbl\">
					${Renderer.utils.getBorderTr()}
					${Renderer.utils.getExcludedTr({isExcluded: Renderer.item.isExcluded(ent)})}
					${Renderer.utils.getNameTr(ent, {page: UrlUtil.PG_ITEMS})}
					<tr><td class=\"rd-item__type-rarity-attunement\" colspan=\"6\">${Renderer.item.getTypeRarityAndAttunementHtml(typeRarityText, subTypeText, tierText)}</td></tr>
					${trTextLeftRight}
					<tr><td colspan=\"6\"><div class=\"ve-tbl-divider\"></div></td></tr>
					${descRow}
					${listRow}
					${Renderer.utils.getPageTr?.(ent) || ""}
					${Renderer.utils.getBorderTr()}
				</table>`
			);
			this._$pgContent.append($tbl);
		} else {
			this._$pgContent.append(RenderItems.$getRenderedItem(ent));
		}
	}

	_renderMagicVariantsSection() {
		const $section = $("<div class='ve-flex-col my-3'></div>");
		$section.append(`<h3>Magic Variants (magicvariants.json + shopmagicvariants.json + homebrew)</h3>`);
		if (!this._magicVariants?.length) {
			$section.append(`<div>No magic variants found.</div>`);
			return $section;
		}
		this._magicVariants.forEach(variant => {
			const $item = RenderItems.$getRenderedItem(variant);
			$section.append($item);
		});
		return $section;
	}

	async pOnLoad(...args) {
		await super.pOnLoad(...args);
	}

	async _pOnLoad_pInitPrimaryLists () {
		const $iptSearch = $("#lst__search");
		const $btnReset = $("#reset");
		const $btnClear = $(`#lst__search-glass`);
		this._mundaneList = this._initList({
			$iptSearch,
			$btnReset,
			$btnClear,
			dispPageTagline: document.getElementById(`page__subtitle`),
			$wrpList: $(`.list.mundane`),
			syntax: this._listSyntax.build(),
			isBindFindHotkey: true,
			optsList: {
				fnSort: PageFilterItems.sortItems,
			},
		});
		this._magicList = this._initList({
			$iptSearch,
			$btnReset,
			$btnClear,
			$wrpList: $(`.list.magic`),
			syntax: this._listSyntax.build(),
			optsList: {
				fnSort: PageFilterItems.sortItems,
			},
		});

		SortUtil.initBtnSortHandlers($("#filtertools-mundane"), this._mundaneList);
		SortUtil.initBtnSortHandlers($("#filtertools-magic"), this._magicList);

		this._mundaneList.nextList = this._magicList;
		this._magicList.prevList = this._mundaneList;

		this._filterBox = await this._pageFilter.pInitFilterBox({
			$iptSearch,
			$wrpFormTop: $(`#filter-search-group`),
			$btnReset,
		});
	}

	_pOnLoad_initVisibleItemsDisplay () {
		const $elesMundaneAndMagic = $(`.ele-mundane-and-magic`);
		$(`.side-label--mundane`).click(() => {
			const filterValues = this._pageFilter.filterBox.getValues();
			const curValue = MiscUtil.get(filterValues, "Miscellaneous", "Mundane");
			this._pageFilter.filterBox.setFromValues({
				Miscellaneous: {
					...(filterValues?.Miscellaneous || {}),
					Mundane: curValue === 1 ? 0 : 1,
				},
			});
		});
		$(`.side-label--magic`).click(() => {
			const filterValues = this._pageFilter.filterBox.getValues();
			const curValue = MiscUtil.get(filterValues, "Miscellaneous", "Magic");
			this._pageFilter.filterBox.setFromValues({
				Miscellaneous: {
					...(filterValues?.Miscellaneous || {}),
					Magic: curValue === 1 ? 0 : 1,
				},
			});
		});
		const $outVisibleResults = $(`.lst__wrp-search-visible`);
		const $wrpListMundane = $(`.itm__wrp-list--mundane`);
		const $wrpListMagic = $(`.itm__wrp-list--magic`);
		const $elesMundane = $(`.ele-mundane`);
		const $elesMagic = $(`.ele-magic`);
		this._mundaneList.on("updated", () => {
			// Force-show the mundane list if there are no items on display
			if (this._magicList.visibleItems.length) $elesMundane.toggleVe(!!this._mundaneList.visibleItems.length);
			else $elesMundane.showVe();
			$elesMundaneAndMagic.toggleVe(!!(this._mundaneList.visibleItems.length && this._magicList.visibleItems.length));

			const current = this._mundaneList.visibleItems.length + this._magicList.visibleItems.length;
			const total = this._mundaneList.items.length + this._magicList.items.length;
			$outVisibleResults.html(`${current}/${total}`);

			// Collapse the mundane section if there are no magic items displayed
			$wrpListMundane.toggleClass(`itm__wrp-list--empty`, this._mundaneList.visibleItems.length === 0);
		});
		this._magicList.on("updated", () => {
			$elesMagic.toggleVe(!!this._magicList.visibleItems.length);
			// Force-show the mundane list if there are no items on display
			if (!this._magicList.visibleItems.length) $elesMundane.showVe();
			else $elesMundane.toggleVe(!!this._mundaneList.visibleItems.length);
			$elesMundaneAndMagic.toggleVe(!!(this._mundaneList.visibleItems.length && this._magicList.visibleItems.length));

			const current = this._mundaneList.visibleItems.length + this._magicList.visibleItems.length;
			const total = this._mundaneList.items.length + this._magicList.items.length;
			$outVisibleResults.html(`${current}/${total}`);

			// Collapse the magic section if there are no magic items displayed
			$wrpListMagic.toggleClass(`itm__wrp-list--empty`, this._magicList.visibleItems.length === 0);
		});
	}

	async _addData (data) {
		super._addData(data);
		// populate table labels
		$(`h3.ele-mundane span.side-label`).text("Mundane");
		$(`h3.ele-magic span.side-label`).text("Magic");
	}

	_addListItem (listItem) {
		if (listItem.mundane) this._mundaneList.addItem(listItem.mundane);
		if (listItem.magic) this._magicList.addItem(listItem.magic);
	}
}

const shopPage = new ShopPage();
shopPage.sublistManager = new ShopSublistManager();
window.addEventListener("load", () => shopPage.pOnLoad());

globalThis.dbg_page = shopPage;
