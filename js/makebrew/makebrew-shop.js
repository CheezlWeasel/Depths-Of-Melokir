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
		// Add entry type selector: shop, baseitem, magicvariant
		this._entryTypes = [
			{label: "Shop Item", value: "shop"},
			{label: "Base Item", value: "baseitem"},
			{label: "Magic Variant", value: "magicvariant"},
		];
		this._entryType = "shop";
		// Add all possible type values from Parser.js (static list)
		this._itemTypeOptions = [
			{value: "A", label: "Armor"},
			{value: "M", label: "Melee Weapon"},
			{value: "R", label: "Ranged Weapon"},
			{value: "S", label: "Shield"},
			{value: "G", label: "Adventuring Gear"},
			{value: "SCF", label: "Spellcasting Focus"},
			{value: "T", label: "Tool"},
			{value: "INS", label: "Instrument"},
			{value: "GS", label: "Gaming Set"},
			{value: "P", label: "Potion"},
			{value: "RD", label: "Rod"},
			{value: "RG", label: "Ring"},
			{value: "W", label: "Wand"},
			{value: "WD", label: "Wondrous Item"},
			{value: "VEH", label: "Vehicle"},
			{value: "EXP", label: "Explosive"},
			{value: "AMMO", label: "Ammunition"},
			{value: "MNT", label: "Mount"},
			{value: "POI", label: "Poison"},
			{value: "CON", label: "Container"},
			{value: "OTH", label: "Other"},
			{value: "GV|DMG", label: "Generic Variant (for magicvariant)"},
			// Add more as needed from Parser.js
		];
		this._itemTypeVals = this._itemTypeOptions.map(it => it.value);
		this._itemTypeLabels = {};
		this._itemTypeOptions.forEach(it => this._itemTypeLabels[it.value] = it.label);
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
			new TabUiUtil.TabMeta({name: "Weapon Details", hasBorder: true}),
			new TabUiUtil.TabMeta({name: "Armor Details", hasBorder: true}),
			new TabUiUtil.TabMeta({name: "Item Details", hasBorder: true}),
		], {
			tabGroup: "input",
			cbTabChange: this.doUiSave.bind(this),
		});
		const [infoTab, weaponTab, armorTab, itemTab] = tabs;
		$$`<div class="ve-flex-v-center w-100 no-shrink ui-tab__wrp-tab-heads--border">${tabs.map(it => it.$btnTab)}</div>`.appendTo($wrp);
		tabs.forEach(it => it.$wrpTab.appendTo($wrp));

		// Entry type selector
		const $selType = $(`<select class="form-control input-xs mr-2"></select>`)
			.change(() => {
				this._entryType = $selType.val();
				this.renderInput();
				this.renderOutput();
			})
			.append(this._entryTypes.map(t => `<option value="${t.value}"${t.value === this._entryType ? " selected" : ""}>${t.label}</option>`));
		$$`<div class="mb-2">Entry Type: ${$selType}</div>`.prependTo($wrp);

		// INFO
		BuilderUi.$getStateIptString("Name", cb, this._state, {nullable: false, callback: () => this.pRenderSideMenu()}, "name").appendTo(infoTab.$wrpTab);
		this._$selSource = this.$getSourceInput(cb).appendTo(infoTab.$wrpTab);
		if (this._entryType === "shop" || this._entryType === "baseitem") {
			BuilderUi.$getStateIptEnum(
				"Type",
				cb,
				this._state,
				{
					vals: this._itemTypeVals,
					labels: this._itemTypeLabels,
					fnDisplay: v => this._itemTypeLabels[v] || v
				},
				"type"
			).appendTo(infoTab.$wrpTab);
			BuilderUi.$getStateIptNumber("Value", cb, this._state, {}, "value").appendTo(infoTab.$wrpTab);
			BuilderUi.$getStateIptNumber("Weight", cb, this._state, {}, "weight").appendTo(infoTab.$wrpTab);
			BuilderUi.$getStateIptString("Rarity", cb, this._state, {}, "rarity").appendTo(infoTab.$wrpTab);
			BuilderUi.$getStateIptString("Seller", cb, this._state, {}, "seller").appendTo(infoTab.$wrpTab);
		}
		if (this._entryType === "magicvariant") {
			BuilderUi.$getStateIptEnum(
				"Type (e.g. GV|DMG)",
				cb,
				this._state,
				{
					vals: this._itemTypeVals,
					labels: this._itemTypeLabels,
					fnDisplay: v => this._itemTypeLabels[v] || v
				},
				"type"
			).appendTo(infoTab.$wrpTab);
			BuilderUi.$getStateIptString("Edition", cb, this._state, {}, "edition").appendTo(infoTab.$wrpTab);
		}

		// WEAPON DETAILS
		if (this._entryType === "shop" || this._entryType === "baseitem") {
			// Weapon fields
			BuilderUi.$getStateIptBoolean("Weapon", cb, this._state, {}, "weapon").appendTo(weaponTab.$wrpTab);
			BuilderUi.$getStateIptString("Weapon Category", cb, this._state, {}, "weaponCategory").appendTo(weaponTab.$wrpTab);
			BuilderUi.$getStateIptString("Damage (dmg1)", cb, this._state, {}, "dmg1").appendTo(weaponTab.$wrpTab);
			BuilderUi.$getStateIptString("Damage Type", cb, this._state, {}, "dmgType").appendTo(weaponTab.$wrpTab);
			BuilderUi.$getStateIptString("Damage (dmg2)", cb, this._state, {}, "dmg2").appendTo(weaponTab.$wrpTab);
			BuilderUi.$getStateIptString("Range", cb, this._state, {}, "range").appendTo(weaponTab.$wrpTab);
			BuilderUi.$getStateIptNumber("Bonus Weapon", cb, this._state, {}, "bonusWeapon").appendTo(weaponTab.$wrpTab);
		}
		// ARMOR DETAILS
		if (this._entryType === "shop" || this._entryType === "baseitem") {
			// Armor fields
			BuilderUi.$getStateIptString("Armor Category", cb, this._state, {}, "armorCategory").appendTo(armorTab.$wrpTab);
			BuilderUi.$getStateIptString("Strength Requirement", cb, this._state, {}, "strength").appendTo(armorTab.$wrpTab);
			BuilderUi.$getStateIptBoolean("Disadvantage on Stealth", cb, this._state, {}, "stealth").appendTo(armorTab.$wrpTab);
			BuilderUi.$getStateIptNumber("Bonus AC", cb, this._state, {}, "bonusAc").appendTo(armorTab.$wrpTab);
		}
		// ITEM DETAILS
		if (this._entryType === "shop" || this._entryType === "baseitem") {
			BuilderUi.$getStateIptStringArray("Properties", cb, this._state, {shortName: "Property"}, "property").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptBoolean("Attunement", cb, this._state, {}, "reqAttune").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptBoolean("Wondrous Item", cb, this._state, {}, "wondrous").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptString("Charges", cb, this._state, {}, "charges").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptEntries("Text", cb, this._state, {fnPostProcess: BuilderUi.fnPostProcessDice}, "entries").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptStringArray("Other Tags", cb, this._state, {shortName: "Tag"}, "otherTags").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptStringArray("Properties (Additional)", cb, this._state, {shortName: "Property"}, "properties").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptStringArray("Resistances", cb, this._state, {shortName: "Resistance"}, "resist").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptStringArray("Immunities", cb, this._state, {shortName: "Immunity"}, "immune").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptStringArray("Vulnerabilities", cb, this._state, {shortName: "Vulnerability"}, "vulnerable").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptStringArray("Condition Immunities", cb, this._state, {shortName: "Condition"}, "conditionImmune").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptStringArray("Spellcasting Ability", cb, this._state, {shortName: "Ability"}, "spellcastingAbility").appendTo(itemTab.$wrpTab);
		}
		// MAGIC VARIANT DETAILS
		if (this._entryType === "magicvariant") {
			BuilderUi.$getStateIptStringArray("Requires (e.g. {type: 'HA'})", cb, this._state, {shortName: "Require", placeholder: '{"type": "HA"}'}, "requires").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptObject("Inherits (object)", cb, this._state, {placeholder: '{"nameSuffix": " of Gleaming", "source": "XGE", ...}'}, "inherits").appendTo(itemTab.$wrpTab);
			BuilderUi.$getStateIptEntries("Text", cb, this._state, {fnPostProcess: BuilderUi.fnPostProcessDice}, "entries").appendTo(itemTab.$wrpTab);
		}
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
		if (this._entryType === "shop") delete item.seller;

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
			new TabUiUtil.TabMeta({name: this._entryTypes.find(t => t.value === this._entryType).label}),
		], {tabGroup: "output"});
		const [infoTab] = tabs;
		$$`<div class="ve-flex-v-center w-100 no-shrink ui-tab__wrp-tab-heads--border">${tabs.map(it => it.$btnTab)}</div>`.appendTo($wrp);
		tabs.forEach(it => it.$wrpTab.appendTo($wrp));
		const renderableItem = this._getRenderableItem();
		if (RenderItems && typeof RenderItems.$getRenderedItem === "function" && this._entryType === "shop") {
			const $item = RenderItems.$getRenderedItem(renderableItem, {isEditable: true});
			$item.appendTo(infoTab.$wrpTab);
		} else {
			$$`<div class="veapp__msg ve-flex-vh-center">${this._entryType === "baseitem" ? "Base Item JSON Preview" : this._entryType === "magicvariant" ? "Magic Variant JSON Preview" : "Unable to render item: RenderItems is not available."}</div>`.appendTo(infoTab.$wrpTab);
			$$`<pre class="ui-pre w-100">${JSON.stringify(renderableItem, null, 2)}</pre>`.appendTo(infoTab.$wrpTab);
		}
		// --- Download JSON button ---
		const $btnDownload = $(`<button class="btn btn-xs btn-primary mt-2">Download JSON</button>`)
			.click(() => {
				const item = this._getRenderableItem();
				const jsonStr = JSON.stringify(item, null, 2);
				const blob = new Blob([jsonStr], {type: "application/json"});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${item.name ? item.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() : "shop_entry"}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			});
		$btnDownload.appendTo($wrp);
	}
}