import {BuilderBase} from "./makebrew-builder-base.js";
import {BuilderUi} from "./makebrew-builderui.js";

export class MagicVariantBuilder extends BuilderBase {
	constructor () {
		super({
			titleSidebarLoadExisting: "Copy Existing Magic Variant",
			titleSidebarDownloadJson: "Download Magic Variants as JSON",
			prop: "magicvariant",
			titleSelectDefaultSource: "(Same as Magic Variant)",
		});
		this._renderOutputDebounced = MiscUtil.debounce(() => this._renderOutput(), 50);
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
		];
		this._itemTypeVals = this._itemTypeOptions.map(it => it.value);
		this._itemTypeLabels = {};
		this._itemTypeOptions.forEach(it => this._itemTypeLabels[it.value] = it.label);
		this._requirementOptions = [
			{value: `{"armor":true}`, label: "Flag : Armor"},
			{value: `{"type":"HA"}`, label: "Type : Heavy Armor"},
			{value: `{"type":"MA"}`, label: "Type : Medium Armor"},
			{value: `{"type":"LA"}`, label: "Type : Light Armor"},
			{value: `{"type":"R"}`, label: "Type : Ranged Weapon"},
			{value: `{"weapon":true}`, label: "Flag : Weapon"},
			{value: `{"weaponCategory":"simple"}`, label: "Category : Simple Weapons"},
			{value: `{"weaponCategory":"martial"}`, label: "Category : Martial Weapons"},
			{value: `{"type":"M"}`, label: "Type : Melee Weapon"},
			{value: `{"type":"R"}`, label: "Type : Ranged Weapon"},
			{value: `{"type":"S"}`, label: "Type : Shield"},
			{value: `{"type":"SCF"}`, label: "Type : Spellcasting Focus"},
			{value: `{"type":"NS"}`, label: "Type : Instrument"},
			{value: `{"type":"GS"}`, label: "Type : Gaming Set"},
			{value: `{"type":"P"}`, label: "Type : Potion"},
			{value: `{"type":"A"}`, label: "Type : Ammunition"},
		];
		this._requirementOptions.push(
			{value: `{"itemProperty":"2H"}`, label: `Property : Two-Handed`},
			{value: `{"itemProperty":"A"}`, label: `Property : Ammunition`},
			{value: `{"itemProperty":"AF"}`, label: `Property : Ammunition`},
			{value: `{"itemProperty":"BF"}`, label: `Property : Burst Fire`},
			{value: `{"itemProperty":"F"}`, label: `Property : Finesse`},
			{value: `{"itemProperty":"H"}`, label: `Property : Heavy`},
			{value: `{"itemProperty":"L"}`, label: `Property : Light`},
			{value: `{"itemProperty":"LD"}`, label: `Property : Loading`},
			{value: `{"itemProperty":"R"}`, label: `Property : Reach`},
			{value: `{"itemProperty":"RLD"}`, label: `Property : Reload`},
			{value: `{"itemProperty":"S"}`, label: `Property : special`},
			{value: `{"itemProperty":"T"}`, label: `Property : Thrown`},
			{value: `{"itemProperty":"V"}`, label: `Property : Versatile`},
			{value: `{"itemProperty":"UN"}`, label: `Property : Esoteric`},
		);
		this._requirementOptions.push(
			{value: `{"name":"Arbalest"}`, label: "Specific Item : Arbalest (DepthsofMelokir)"},
			{value: `{"name":"Bestial Caestus"}`, label: "Specific Item : Bestial Caestus (DepthsofMelokir)"},
			{value: `{"name":"Bagpipes"}`, label: "Specific Item : Bagpipes (PHB)"},
			{value: `{"name":"Battleaxe"}`, label: "Specific Item : Battleaxe (PHB)"},
			{value: `{"name":"Blowgun"}`, label: "Specific Item : Blowgun (PHB)"},
			{value: `{"name":"Blowgun Needle"}`, label: "Specific Item : Blowgun Needle (PHB)"},
			{value: `{"name":"Blowgun Needles (50)"}`, label: "Specific Item : Blowgun Needles (50) (PHB)"},
			{value: `{"name":"Breastplate"}`, label: "Specific Item : Breastplate (PHB)"},
			{value: `{"name":"Chain Mail"}`, label: "Specific Item : Chain Mail (PHB)"},
			{value: `{"name":"Chain Shirt"}`, label: "Specific Item : Chain Shirt (PHB)"},
			{value: `{"name":"Club"}`, label: "Specific Item : Club (PHB)"},
			{value: `{"name":"Crystal"}`, label: "Specific Item : Crystal (PHB)"},
			{value: `{"name":"Dagger"}`, label: "Specific Item : Dagger (PHB)"},
			{value: `{"name":"Dart"}`, label: "Specific Item : Dart (PHB)"},
			{value: `{"name":"Drum"}`, label: "Specific Item : Drum (PHB)"},
			{value: `{"name":"Dulcimer"}`, label: "Specific Item : Dulcimer (PHB)"},
			{value: `{"name":"Fan Shield"}`, label: "Specific Item : Fan Shield (DepthsofMelokir)"},
			{value: `{"name":"Flail"}`, label: "Specific Item : Flail (PHB)"},
			{value: `{"name":"Glaive"}`, label: "Specific Item : Glaive (PHB)"},
			{value: `{"name":"Greataxe"}`, label: "Specific Item : Greataxe (PHB)"},
			{value: `{"name":"Greatclub"}`, label: "Specific Item : Greatclub (PHB)"},
			{value: `{"name":"Greatsword"}`, label: "Specific Item : Greatsword (PHB)"},
			{value: `{"name":"Halberd"}`, label: "Specific Item : Halberd (PHB)"},
			{value: `{"name":"Half Plate Armor"}`, label: "Specific Item : Half Plate Armor (PHB)"},
			{value: `{"name":"Hand Crossbow"}`, label: "Specific Item : Hand Crossbow (PHB)"},
			{value: `{"name":"Handaxe"}`, label: "Specific Item : Handaxe (PHB)"},
			{value: `{"name":"Heavy Crossbow"}`, label: "Specific Item : Heavy Crossbow (PHB)"},
			{value: `{"name":"Hide Armor"}`, label: "Specific Item : Hide Armor (PHB)"},
			{value: `{"name":"Horn"}`, label: "Specific Item : Horn (PHB)"},
			{value: `{"name":"Javelin"}`, label: "Specific Item : Javelin (PHB)"},
			{value: `{"name":"Katar"}`, label: "Specific Item : Katar (SterlingVermin)"},
			{value: `{"name":"Knuckledusters"}`, label: "Specific Item : Knuckledusters (DepthsofMelokir)"},
			{value: `{"name":"Knuckle Knives"}`, label: "Specific Item : Knuckle Knives (SterlingVermin)"},
			{value: `{"name":"Lance"}`, label: "Specific Item : Lance (PHB)"},
			{value: `{"name":"Leather Armor"}`, label: "Specific Item : Leather Armor (PHB)"},
			{value: `{"name":"Light Crossbow"}`, label: "Specific Item : Light Crossbow (PHB)"},
			{value: `{"name":"Light Hammer"}`, label: "Specific Item : Light Hammer (PHB)"},
			{value: `{"name":"Longbow"}`, label: "Specific Item : Longbow (PHB)"},
			{value: `{"name":"Longsword"}`, label: "Specific Item : Longsword (PHB)"},
			{value: `{"name":"Lute"}`, label: "Specific Item : Lute (PHB)"},
			{value: `{"name":"Lyre"}`, label: "Specific Item : Lyre (PHB)"},
			{value: `{"name":"Mace"}`, label: "Specific Item : Mace (PHB)"},
			{value: `{"name":"Maul"}`, label: "Specific Item : Maul (PHB)"},
			{value: `{"name":"Morningstar"}`, label: "Specific Item : Morningstar (PHB)"},
			{value: `{"name":"Net"}`, label: "Specific Item : Net (PHB)"},
			{value: `{"name":"Orb"}`, label: "Specific Item : Orb (PHB)"},
			{value: `{"name":"Pike"}`, label: "Specific Item : Pike (PHB)"},
			{value: `{"name":"Quarterstaff"}`, label: "Specific Item : Quarterstaff (PHB)"},
			{value: `{"name":"Rapier"}`, label: "Specific Item : Rapier (PHB)"},
			{value: `{"name":"Scimitar"}`, label: "Specific Item : Scimitar (PHB)"},
			{value: `{"name":"Spear"}`, label: "Specific Item : Spear (PHB)"},
			{value: `{"name":"Staff"}`, label: "Specific Item : Staff (PHB)"},
			{value: `{"name":"Sickle"}`, label: "Specific Item : Sickle (PHB)"},
			{value: `{"name":"Shortbow"}`, label: "Specific Item : Shortbow (PHB)"},
			{value: `{"name":"Warhammer"}`, label: "Specific Item : Warhammer (PHB)"},
			{value: `{"name":"Wicked Sickle"}`, label: "Specific Item : Wicked Sickle (DepthsofMelokir)"},
		);

		this._requirementVals = this._requirementOptions.map(it => it.value);
		this._requirementLabels = {};
		this._requirementOptions.forEach(it => this._requirementLabels[it.value] = it.label);

		this._rarityOptions = [
			{value: "common", label: "Common"},
			{value: "uncommon", label: "Uncommon"},
			{value: "rare", label: "Rare"},
			{value: "very rare", label: "Very Rare"},
			{value: "legendary", label: "Legendary"},
			{value: "artifact", label: "Artifact"},
			{value: "varies", label: "Varies"},
			{value: "none", label: "None"},
		];
		this._rarityVals = this._rarityOptions.map(it => it.value);
		this._rarityLabels = {};
		this._rarityOptions.forEach(it => this._rarityLabels[it.value] = it.label);
	}

	// Define a helper function to convert JSON source titles to full names
	_sourceJsonToFull (src) {
		const sourceMap = {
			"PHB": "Player's Handbook",
			"DMG": "Dungeon Master's Guide",
			"XGE": "Xanathar's Guide to Everything",
			"TCE": "Tasha's Cauldron of Everything",
			"DepthsofMelokir": "Depths of Melokir",
			"SterlingVermin": "Sterling Vermin Adventuring Co.",
			"ArcaneAL": "Arcane and Aluminium",
			"SacredTree": "The Sacred Tree",
			"Feywild": "The Feywild",
			"LandsofVita": "The Lands of Vita",
			"VerdigrisRuins": "The Verdigris Ruins",
		};
		return sourceMap[src] || src; // Fallback to the original source if no mapping exists
	}

	_getInitialState () {
		return {
			...super._getInitialState(),
			name: "New Magic Variant",
			type: "GV|DMG",
			edition: "",
			requires: [],
			excludes: [],
			inherits: {},
			entries: [],
			source: this._ui ? this._ui.source : "",
		};
	}

	setStateFromLoaded (state) {
		if (!state?.s || !state?.m) return;
		this._doResetProxies();
		if (!state.s.uniqueId) state.s.uniqueId = CryptUtil.uid();
		this.__state = state.s;
		this.__meta = state.m;
	}

	_renderInputImpl () {
		this.doCreateProxies();
		this.renderInputControls();
		this._renderInputMain();
	}

	_renderInputMain () {
		this._sourcesCache = MiscUtil.copy(this._ui.allSources);
		const $wrp = this._ui.$wrpInput.empty();
		const cb = () => {
			this.renderOutput();
			this.doUiSave();
			this._meta.isModified = true;
		};
		this._cbCache = cb;
		BuilderUi.$getStateIptString("Name", cb, this._state, {nullable: false, callback: () => this.pRenderSideMenu()}, "name").appendTo($wrp);
		this._$selSource = this.$getSourceInput(cb).appendTo($wrp);
		BuilderUi.$getStateIptEnum(
			"Rarity",
			cb,
			this._state,
			{
				vals: this._rarityVals,
				labels: this._rarityLabels,
				fnDisplay: v => this._rarityLabels[v] || v
			},
			"rarity"
		).appendTo($wrp);
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
		).appendTo($wrp);
		BuilderUi.$getStateIptEntries("Text", cb, this._state, {
			fnPostProcess: (text) => {
				// If text is an array, join it to a string for formatting
				if (Array.isArray(text)) text = text.join("\n");
				if (typeof text !== "string") text = String(text); // Ensure text is a string
				// Format bold/italic
				text = text.replace(/\*\*(.*?)\*\*/g, `{@b $1}`).replace(/\*(.*?)\*/g, `{@i $1}`);
				// Split back into array by newlines, trim, and filter
				return text.split(/\r?\n/).map(e => e.trim()).filter(Boolean);
			},
		}, "entries").appendTo($wrp);

		// Add dynamic dropdowns for the `requires` property
		const $wrpRequires = $("<div class='mb-3'></div>").appendTo($wrp);
		$wrpRequires.append("<label><b>Requires</b></label>");

		const updateRequiresState = () => {
			const vals = $wrpRequires.find("select").map(function() { return $(this).val(); }).get().filter(Boolean);
			this._state.requires = [...new Set(vals)];
			cb();
		};

		const renderRequiresDropdowns = () => {
			$wrpRequires.empty();
			const selected = this._state.requires && Array.isArray(this._state.requires) ? this._state.requires : [];
			const dropdownCount = selected.length ? selected.length + 1 : 1;
			for (let i = 0; i < dropdownCount; ++i) {
				const val = selected[i] || "";
				const $row = $(`<div class="mb-2 mkbru__row stripe-even ve-flex-v-center"></div>`);
				$row.append(`<span class="mr-2 mkbru__row-name ">Requirement</span>`)
				const $sel = $(`<select class="form-control input-xs form-control--minimal"></select>`);
				$sel.append($("<option value=''>Select Requirement</option>"));
				this._requirementOptions.forEach(opt => {
					$sel.append($("<option></option>").val(opt.value).text(opt.label));
				});
				$sel.val(val);
				$sel.change(() => {
					if (!$sel.val()) {
						this._state.requires = selected.slice(0, i);
					} else {
						const newSelected = selected.slice(0, i);
						if ($sel.val()) newSelected.push($sel.val());
						this._state.requires = newSelected;
					}
					renderRequiresDropdowns();
					updateRequiresState();
				});
				$row.append($sel);
				$wrpRequires.append($row);
			}
		};
		if (!Array.isArray(this._state.requires)) this._state.requires = [];
		renderRequiresDropdowns();

		// Add dynamic dropdowns for the `excludes` property
		const $wrpExcludes = $("<div class='mb-3'></div>").appendTo($wrp);

		const updateExcludesState = () => {
			const vals = $wrpExcludes.find("select").map(function() { return $(this).val(); }).get().filter(Boolean);
			this._state.excludes = [...new Set(vals)];
			cb();
		};

		const renderExcludesDropdowns = () => {
			$wrpExcludes.empty();
			const selected = this._state.excludes && Array.isArray(this._state.excludes) ? this._state.excludes : [];
			const dropdownCount = selected.length ? selected.length + 1 : 1;
			for (let i = 0; i < dropdownCount; ++i) {
				const val = selected[i] || "";
				const $row = $(`<div class="mb-2 mkbru__row stripe-even ve-flex-v-center"></div>`);
				$row.append(`<span class="mr-2 mkbru__row-name ">Exclusion</span>`)
				const $sel = $(`<select class="form-control input-xs form-control--minimal"></select>`);
				$sel.append($("<option value=''>Select Exclusion</option>"));
				this._requirementOptions.forEach(opt => {
					$sel.append($("<option></option>").val(opt.value).text(opt.label));
				});
				$sel.val(val);
				$sel.change(() => {
					if (!$sel.val()) {
						this._state.excludes = selected.slice(0, i);
					} else {
						const newSelected = selected.slice(0, i);
						if ($sel.val()) newSelected.push($sel.val());
						this._state.excludes = newSelected;
					}
					renderExcludesDropdowns();
					updateExcludesState();
				});
				$row.append($sel);
				$wrpExcludes.append($row);
			}
		};
		if (!Array.isArray(this._state.excludes)) this._state.excludes = [];
		renderExcludesDropdowns();

		// Replace the inherits input with individual form elements
		const $inheritsWrapper = $(`<div class="mb-2 mkbru__row stripe-even"></div>`).appendTo($wrp);
		$inheritsWrapper.append("<label><b>Inherits</b></label>");

		// Add text field for nameSuffix
		const $nameSuffix = $("<input class='form-control input-xs form-control--minimal' placeholder='Name Suffix (e.g., of Gleaming)'>")
			.val(this._state.inherits.nameSuffix || "")
			.change(() => {
				this._state.inherits.nameSuffix = $nameSuffix.val().trim() || undefined;
				cb();
			})
			.appendTo($inheritsWrapper);
		// Add new fields for prefix, value, and seller within inherits
		const $namePrefix = $("<input class='form-control input-xs form-control--minimal' placeholder='Name Prefix (e.g., Hookshot )'>")
			.val(this._state.inherits.namePrefix || "")
			.change(() => {
				this._state.inherits.namePrefix = $namePrefix.val().trim() || undefined;
				cb();
			})
			.appendTo($inheritsWrapper);

		// Update the value field to handle both static and dynamic values
		const $value = $("<input class='form-control input-xs form-control--minimal' placeholder='Value in CP'>")
			.val(this._state.inherits.value || "")
			.change(() => {
				console.log(this._state.inherits.includeBaseItemCost);
				this._state.inherits.value = $value.val()
				if (this._state.inherits.includeBaseItemCost) {
					// Remove the value field and add valueExpression
					this._state.inherits.valueExpression = `[[baseItem.value]] + ${this._state.inherits.value || 0}`;
					this._state.inherits.value = undefined;
				} else {
					// Restore the value field and remove valueExpression
					if (!(this._state.inherits.valueExpression === undefined)) {
						this._state.inherits.value = this._state.inherits.valueExpression
							.replace(/^\[\[baseItem\.value\]\] \+ /, "") // Remove '[[baseItem.value]] +'
							.trim();
						this._state.inherits.value = parseInt(this._state.inherits.value, 10) || 0; // Convert to integer
					}
				}
				cb();
			})
			.appendTo($inheritsWrapper);

		const $seller = $("<input class='form-control input-xs form-control--minimal' placeholder='Seller'>")
			.val(this._state.inherits.seller || "")
			.change(() => {
				this._state.inherits.seller = $seller.val().trim() || undefined;
				cb();
			})
			.appendTo($inheritsWrapper);

		// Add more fields as needed for other properties of `inherits`
		// Add dropdown for source
		const $source = $("<select class='form-control input-xs form-control--minimal'></select>")
			.append(`<option value="">Select Source</option>`)
			.append(this._sourcesCache.map(src => {
				const fullName = this._sourceJsonToFull(src); // Assuming a method exists to get the full name
				return `<option value="${src}" ${this._state.inherits.source === src ? "selected" : ""}>${fullName}</option>`;
			}))
			.change(() => {
				this._state.inherits.source = $source.val() || undefined;
				cb();
			})
			.appendTo($inheritsWrapper);

		// Add dropdown for rarity in the inherits field
		const $inheritsRarity = $("<select class='form-control input-xs form-control--minimal'></select>");
		$inheritsRarity.append(`<option value="">Select Rarity</option>`);
		this._rarityOptions.forEach(opt => {
			$inheritsRarity.append($("<option></option>").val(opt.value).text(opt.label));
		});
		$inheritsRarity.val(this._state.inherits.rarity || "");
		$inheritsRarity.change(() => {
			this._state.inherits.rarity = $inheritsRarity.val() || undefined;
			cb();
		});
		$inheritsRarity.appendTo($inheritsWrapper);

		// Add checkbox for additional options
		const $isLegendary = $("<label><input type='checkbox'> Is Legendary</label>")
			.find("input")
			.prop("checked", !!this._state.inherits.isLegendary)
			.change(() => {
				this._state.inherits.isLegendary = $isLegendary.prop("checked") || undefined;
				cb();
			})
			.end()
			//.appendTo($inheritsWrapper);

		// Add a unique entries box to the inherits tab
		const $inheritsEntries = $("<textarea class='form-control input-xs form-control--minimal' placeholder='Entries Inherited by each BaseItem'></textarea>")
			.val(this._state.inherits.entries ? this._state.inherits.entries.join("\n") : "")
			.change(() => {
				const entries = $inheritsEntries.val().trim().split("\n").filter(Boolean);
				this._state.inherits.entries = entries.length ? entries : undefined;
				cb();
			})
			.appendTo($inheritsWrapper);

		// Add checkbox for "Include base item cost"
		const $includeBaseItemCostInput = $("<input type='checkbox'>").prop("checked", !!this._state.inherits.includeBaseItemCost);
		const $includeBaseItemCostLabel = $("<label></label>").append($includeBaseItemCostInput).append(" Include base item cost");
		$includeBaseItemCostInput.change(() => {
			const isChecked = $includeBaseItemCostInput.prop("checked");
			console.log("Checkbox is checked:", isChecked); // Debugging log to verify checkbox state
			this._state.inherits.includeBaseItemCost = isChecked;
			this._state.inherits.value = $value.val();
			if (isChecked) {
				this._state.inherits.valueExpression = `[[baseItem.value]] + ${this._state.inherits.value || 0}`;
				this._state.inherits.value = undefined;
			} else {
				if (!(this._state.inherits.valueExpression === undefined)) {
					this._state.inherits.value = this._state.inherits.valueExpression
						.replace(/^\[\[baseItem\.value\]\] \+ /, "")
						.trim();
					this._state.inherits.value = parseInt(this._state.inherits.value, 10) || 0;
					this._state.inherits.valueExpression = undefined;
				}
			}
			cb();
		});
		$includeBaseItemCostLabel.appendTo($inheritsWrapper);

		// Add checkbox for attunement requirement
		const $attunementCheckbox = $("<input type='checkbox'>").prop("checked", !!this._state.inherits.reqAttune);
		const $attunementLabel = $("<label></label>").append($attunementCheckbox).append(" Requires Attunement");
		$attunementCheckbox.change(() => {
			this._state.inherits.reqAttune = $attunementCheckbox.prop("checked") ? true : undefined;
			cb();
		});
		$attunementLabel.appendTo($inheritsWrapper);

		// Add input for inherited value
	}

	renderOutput () {
		this._renderOutput();
	}

	_getRenderableItem () {
		const item = MiscUtil.copy(this._state);

		// Ensure `inherits` is built from the form inputs
		if (item.inherits) {
			item.inherits = {
				nameSuffix: item.inherits.nameSuffix || undefined,
				namePrefix: item.inherits.namePrefix || undefined,
				source: item.inherits.source || undefined,
				isLegendary: item.inherits.isLegendary || undefined,
				seller: item.inherits.seller || undefined,
				value: item.inherits.value || undefined, // Ensure value is included
				valueExpression: item.inherits.valueExpression || undefined, // Ensure valueExpression is included
				entries: item.inherits.entries || undefined,
				// Add other properties as needed
			};
			// Remove undefined properties
			Object.keys(item.inherits).forEach(key => {
				if (item.inherits[key] === undefined) delete item.inherits[key];
			});
		}

		// Parse `requires` entries from JSON strings to objects
		if (item.requires && Array.isArray(item.requires)) {
			item.requires = item.requires.map(req => {
				try {
					return JSON.parse(req);
				} catch (e) {
					return req; // Fallback to the original value if parsing fails
				}
			});
		}

		// Parse `excludes` entries from JSON strings to objects
		if (item.excludes && Array.isArray(item.excludes)) {
			item.excludes = item.excludes.map(req => {
				try {
					return JSON.parse(req);
				} catch (e) {
					return req; // Fallback to the original value if parsing fails
				}
			});
		}

		// --- Support lists in entries ---
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
		// --- Support lists in inherits.entries ---
		if (item.inherits && Array.isArray(item.inherits.entries) && item.inherits.entries.length) {
			let newEntries = [];
			let currentList = null;
			item.inherits.entries.forEach(entry => {
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
			item.inherits.entries = newEntries;
		}

		// Remove empty or undefined properties from the main item
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
		const renderableItem = this._getRenderableItem();
		$$`<div class="veapp__msg ve-flex-vh-center">Magic Variant JSON Preview</div>`.appendTo($wrp);
		$$`<pre class="ui-pre w-100">${JSON.stringify(renderableItem, null, 2)}</pre>`.appendTo($wrp);
		const $btnDownload = $("<button class=\"btn btn-xs btn-primary mt-2\">Download JSON</button>")
			.click(() => {
				const item = this._getRenderableItem();
				const jsonStr = JSON.stringify(item, null, 2);
				const blob = new Blob([jsonStr], {type: "application/json"});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${item.name ? item.name.replace(/[^a-z0-9]/gi, "_").toLowerCase() : "magicvariant"}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			});
		$btnDownload.appendTo($wrp);
	}
}
