/* https://github.com/fregante/webext-domain-permission-toggle @ v1.0.1 */

var addDomainPermissionToggle = (function () {
    'use strict';

    async function getManifestPermissions() {
        return getManifestPermissionsSync();
    }
    function getManifestPermissionsSync() {
        var _a, _b;
        const manifest = chrome.runtime.getManifest();
        const manifestPermissions = {
            origins: [],
            permissions: []
        };
        const list = new Set([
            ...((_a = manifest.permissions) !== null && _a !== void 0 ? _a : []),
            ...((_b = manifest.content_scripts) !== null && _b !== void 0 ? _b : []).flatMap(config => { var _a; return (_a = config.matches) !== null && _a !== void 0 ? _a : []; })
        ]);
        for (const permission of list) {
            if (permission.includes('://')) {
                manifestPermissions.origins.push(permission);
            }
            else {
                manifestPermissions.permissions.push(permission);
            }
        }
        return manifestPermissions;
    }

    const contextMenuId = 'webext-domain-permission-toggle:add-permission';
    let currentTabId;
    let globalOptions;
    async function p(fn, ...args) {
        return new Promise((resolve, reject) => {
            fn(...args, result => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve(result);
                }
            });
        });
    }
    async function isOriginPermanentlyAllowed(origin) {
        return p(chrome.permissions.contains, {
            origins: [
                origin + '/*'
            ]
        });
    }
    function createMenu() {
        chrome.contextMenus.remove(contextMenuId, () => chrome.runtime.lastError);
        chrome.contextMenus.create({
            id: contextMenuId,
            type: 'checkbox',
            checked: false,
            title: globalOptions.title,
            contexts: [
                'page_action',
                'browser_action'
            ],
            documentUrlPatterns: [
                'http://*/*',
                'https://*/*'
            ]
        });
    }
    function updateItem({ tabId }) {
        chrome.tabs.executeScript(tabId, {
            code: 'location.origin'
        }, async ([origin] = []) => {
            const settings = {
                checked: false,
                enabled: true
            };
            if (!chrome.runtime.lastError && origin) {
                const manifestPermissions = await getManifestPermissions();
                const isDefault = manifestPermissions.origins.some(permission => permission.startsWith(origin));
                settings.enabled = !isDefault;
                settings.checked = isDefault || await isOriginPermanentlyAllowed(origin);
            }
            chrome.contextMenus.update(contextMenuId, settings);
        });
    }
    async function handleClick({ wasChecked, menuItemId }, tab) {
        if (menuItemId !== contextMenuId || !tab) {
            return;
        }
        try {
            const successful = await p(wasChecked ? chrome.permissions.remove : chrome.permissions.request, {
                origins: [
                    new URL(tab.url).origin + '/*'
                ]
            });
            if (wasChecked && successful) {
                chrome.contextMenus.update(contextMenuId, {
                    checked: false
                });
            }
            if (!wasChecked && successful && globalOptions.reloadOnSuccess) {
                chrome.tabs.executeScript({
                    code: `confirm(${JSON.stringify(globalOptions.reloadOnSuccess)}) && location.reload()`
                });
            }
        }
        catch (error) {
            console.error(error.message);
            alert(`Error: ${error.message}`);
            updateItem({ tabId: tab.id });
        }
    }
    function addDomainPermissionToggle(options) {
        if (globalOptions) {
            throw new Error('webext-domain-permission-toggle can only be initialized once');
        }
        const { name } = chrome.runtime.getManifest();
        globalOptions = { title: `Enable ${name} on this domain`,
            reloadOnSuccess: `Do you want to reload this page to apply ${name}?`, ...options };
        chrome.contextMenus.onClicked.addListener(handleClick);
        chrome.tabs.onActivated.addListener(updateItem);
        chrome.tabs.onUpdated.addListener((tabId, { status }) => {
            if (currentTabId === tabId && status === 'complete') {
                updateItem({ tabId });
            }
        });
        createMenu();
    }

    return addDomainPermissionToggle;

}());
