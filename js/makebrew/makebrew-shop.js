import {BuilderBase} from "./makebrew-builder-base.js";
import {BuilderUi} from "./makebrew-builderui.js";
import {RenderItems} from "../render-items.js";

export class ShopBuilder extends BuilderBase {
	constructor () {
		super({
			titleSidebarLoadExisting: "Copy Existing Shop Entry",
			titleSidebarDownloadJson: "Download Shop Entries as JSON",
			prop: "shop",
			titleSelectDefaultSource: "(Same as Shop)",
		});
		this._renderOutputDebounced = MiscUtil.debounce(() => this._renderOutput(), 50);
	}

	async pHandleSidebarLoadExistingClick () {
		// Implement a search widget for shop entries if available, else no-op
		// Placeholder: you may want to implement a custom search for shop entries
		// const result = await SearchWidget.pGetUserShopSearch();
		// if (result) {
		//     const shop = MiscUtil.copy(await DataLoader.pCacheAndGet(result.page, result.source, result.hash));
		//     return this.pHandleSidebarLoadExistingData(shop);
		// }
	}

	async pHandleSidebarLoadExistingData (shop, opts) {
		opts = opts || {};
		shop.source = this._ui.source;
		delete shop.uniqueId;
		const meta = {...(opts.meta || {}), ...this._getInitialMetaState()};
		this.setStateFromLoaded({s: shop, m: meta});
		this.renderInput();
		this.renderOutput();
	}

	_getInitialState () {
		return {
			...super._getInitialState(),
			name: "New Shop Item",
			type: "M",
			value: 0,
			weight: 0,
			rarity: "none",
			seller: "",
			source: this._ui ? this._ui.source : "",
			// Add other default shop fields as needed
		};
	}

	setStateFromLoaded (state) {
		if (!state?.s || !state?.m) return;
		this._doResetProxies();
		if (!state.s.uniqueId) state.s.uniqueId = CryptUtil.uid();
		this.__state = state.s;
		this.__meta = state.m;
	}

	doHandleSourcesAdd () { /* No-op for shop */ }

	_renderInputImpl () {
		this.doCreateProxies();
		this.renderInputControls();
		this._renderInputMain();
	}

	_renderInputMain () {
		this._sourcesCache = MiscUtil.copy(this._ui.allSources);
		const $wrp = this._ui.$wrpInput.empty();
		// Remove debounce for immediate rendering
		const cb = () => {
			this.renderOutput();
			this.doUiSave();
			this._meta.isModified = true;
		};
		this._cbCache = cb;
		this._resetTabs({tabGroup: "input"});
		const tabs = this._renderTabs([
			new TabUiUtil.TabMeta({name: "Info", hasBorder: true}),
			new TabUiUtil.TabMeta({name: "Item Details", hasBorder: true}),
		], {
			tabGroup: "input",
			cbTabChange: this.doUiSave.bind(this),
		});
		const [infoTab, detailsTab] = tabs;
		$$`<div class="ve-flex-v-center w-100 no-shrink ui-tab__wrp-tab-heads--border">${tabs.map(it => it.$btnTab)}</div>`.appendTo($wrp);
		tabs.forEach(it => it.$wrpTab.appendTo($wrp));
		// INFO
		BuilderUi.$getStateIptString("Name", cb, this._state, {nullable: false, callback: () => this.pRenderSideMenu()}, "name").appendTo(infoTab.$wrpTab);
		this._$selSource = this.$getSourceInput(cb).appendTo(infoTab.$wrpTab);
		BuilderUi.$getStateIptString("Type", cb, this._state, {}, "type").appendTo(infoTab.$wrpTab);
		BuilderUi.$getStateIptNumber("Value", cb, this._state, {}, "value").appendTo(infoTab.$wrpTab);
		BuilderUi.$getStateIptNumber("Weight", cb, this._state, {}, "weight").appendTo(infoTab.$wrpTab);
		BuilderUi.$getStateIptString("Rarity", cb, this._state, {}, "rarity").appendTo(infoTab.$wrpTab);
		BuilderUi.$getStateIptString("Seller", cb, this._state, {}, "seller").appendTo(infoTab.$wrpTab);
		// ITEM DETAILS (match items.json structure)
		BuilderUi.$getStateIptStringArray("Properties", cb, this._state, {shortName: "Property"}, "property").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptBoolean("Attunement", cb, this._state, {}, "reqAttune").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptBoolean("Wondrous Item", cb, this._state, {}, "wondrous").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptString("Charges", cb, this._state, {}, "charges").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptEntries("Text", cb, this._state, {fnPostProcess: BuilderUi.fnPostProcessDice}, "entries").appendTo(detailsTab.$wrpTab);
		// Additional fields from items.json
		BuilderUi.$getStateIptBoolean("Weapon", cb, this._state, {}, "weapon").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptString("Weapon Category", cb, this._state, {}, "weaponCategory").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptString("Damage (dmg1)", cb, this._state, {}, "dmg1").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptString("Damage Type", cb, this._state, {}, "dmgType").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptString("Damage (dmg2)", cb, this._state, {}, "dmg2").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptString("Range", cb, this._state, {}, "range").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptString("Armor Category", cb, this._state, {}, "armorCategory").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptString("Strength Requirement", cb, this._state, {}, "strength").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptBoolean("Disadvantage on Stealth", cb, this._state, {}, "stealth").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptNumber("Bonus Weapon", cb, this._state, {}, "bonusWeapon").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptNumber("Bonus AC", cb, this._state, {}, "bonusAc").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptStringArray("Other Tags", cb, this._state, {shortName: "Tag"}, "otherTags").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptStringArray("Properties (Additional)", cb, this._state, {shortName: "Property"}, "properties").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptStringArray("Resistances", cb, this._state, {shortName: "Resistance"}, "resist").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptStringArray("Immunities", cb, this._state, {shortName: "Immunity"}, "immune").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptStringArray("Vulnerabilities", cb, this._state, {shortName: "Vulnerability"}, "vulnerable").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptStringArray("Condition Immunities", cb, this._state, {shortName: "Condition"}, "conditionImmune").appendTo(detailsTab.$wrpTab);
		BuilderUi.$getStateIptStringArray("Spellcasting Ability", cb, this._state, {shortName: "Ability"}, "spellcastingAbility").appendTo(detailsTab.$wrpTab);
	}

	renderOutput () {
		this._renderOutput();
	}

	_getRenderableItem() {
		// Clone state to avoid mutating the builder state
		const item = MiscUtil.copy(this._state);

		// --- Normalize attunement ---
		// Only set attunement if reqAttune is true (boolean) or a non-empty string (not 'false')
		if (item.reqAttune === true) {
			item.attunement = true;
		} else if (typeof item.reqAttune === "string") {
			const trimmed = item.reqAttune.trim().toLowerCase();
			if (trimmed && trimmed !== "false") {
				item.attunement = trimmed === "true" ? true : item.reqAttune.trim();
			}
		}
		// Do not set attunement if reqAttune is false/null/undefined or string 'false'
		// Do not delete reqAttune so it is preserved for saving

		// --- Normalize entries ---
		if (typeof item.entries === "string") {
			// If entries is a string, wrap in array
			item.entries = [item.entries];
		} else if (!Array.isArray(item.entries)) {
			item.entries = [];
		}

		// --- Support lists in entries ---
		// If any entry line starts with "- ", convert to a list object
		if (Array.isArray(item.entries) && item.entries.length) {
			let newEntries = [];
			let currentList = null;
			item.entries.forEach(entry => {
				if (typeof entry === "string" && entry.trim().startsWith("- ")) {
					if (!currentList) currentList = {type: "list", items: []};
					currentList.items.push(entry.trim().slice(2));
				} else {
					if (currentList) {
						newEntries.push(currentList);
						currentList = null;
					}
					newEntries.push(entry);
				}
			});
			if (currentList) newEntries.push(currentList);
			item.entries = newEntries;
		}

		// --- Normalize weight ---
		if (typeof item.weight === "string" && item.weight.trim() !== "") {
			const num = Number(item.weight);
			if (!isNaN(num)) item.weight = num;
		}

		// --- Normalize page ---
		if (typeof item.page === "string" && item.page.trim() !== "") {
			const num = Number(item.page);
			if (!isNaN(num)) item.page = num;
		}

		// --- Normalize rarity ---
		if (typeof item.rarity !== "string" || !item.rarity.trim() || ["none","false","true"].includes(item.rarity.trim().toLowerCase())) {
			item.rarity = undefined;
		} else {
			item.rarity = item.rarity.trim();
			// Capitalize first letter for display (matches 5etools style)
			item.rarity = item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1).toLowerCase();
		}

		// --- Ensure source is always set ---
		if (!item.source) {
			item.source = "Temp";
		}

		// --- Remove fields not expected by the renderer ---
		delete item.seller;

		// --- Remove undefined/empty fields ---
		Object.keys(item).forEach(k => {
			if (
				item[k] === undefined ||
				item[k] === "" ||
				(Array.isArray(item[k]) && !item[k].length)
			) delete item[k];
		});

		return item;
	}

	_renderOutput () {
		const $wrp = this._ui.$wrpOutput.empty();
		this._resetTabs({tabGroup: "output"});
		const tabs = this._renderTabs([
			new TabUiUtil.TabMeta({name: "Shop Item"}),
		], {tabGroup: "output"});
		const [infoTab] = tabs;
		$$`<div class="ve-flex-v-center w-100 no-shrink ui-tab__wrp-tab-heads--border">${tabs.map(it => it.$btnTab)}</div>`.appendTo($wrp);
		tabs.forEach(it => it.$wrpTab.appendTo($wrp));
		// Always render using RenderItems, as in items.html
		if (RenderItems && typeof RenderItems.$getRenderedItem === "function") {
			const renderableItem = this._getRenderableItem();
			const $item = RenderItems.$getRenderedItem(renderableItem, {isEditable: true});
			$item.appendTo(infoTab.$wrpTab);
		} else {
			$$`<div class="veapp__msg ve-flex-vh-center">Unable to render item: RenderItems is not available.</div>`.appendTo(infoTab.$wrpTab);
		}
	}
}