const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({acceptDownloads:true});
    const unexpected = [];
    page.on('pageerror', e => unexpected.push(e.message));
    await page.goto('http://127.0.0.1:8000');
    const png = page.locator('#dlPng');
    await page.waitForFunction(() => !document.querySelector('#dlPng').disabled);
    for (const id of ['dlPng','dlSvg','dlJpg']) {
      const event = page.waitForEvent('download');
      await page.locator('#'+id).click();
      const download = await event;
      assert.equal(await download.failure(), null);
    }
    await page.locator('[data-k="url"]').fill('');
    assert(await png.isDisabled(), 'Empty input must invalidate prior export');
    await page.locator('[data-k="url"]').fill('javascript:alert(1)');
    assert(await png.isDisabled(), 'Reject unsafe web schemes');
    await page.locator('[data-k="url"]').fill('https://example.com');
    await page.waitForFunction(() => !document.querySelector('#dlPng').disabled);
    await page.getByRole('button', {name:'Text',exact:true}).click();
    await page.locator('[data-k="content"]').fill('a'.repeat(3000));
    assert(await png.isDisabled(), 'Oversized input must invalidate export');
    await page.getByRole('button', {name:'WiFi',exact:true}).click();
    assert.equal(await page.locator('[data-k="password"]').getAttribute('type'),'password');
    await page.locator('[data-k="ssid"]').fill('Guest');
    await page.locator('[data-k="password"]').fill('private-test-value');
    await page.waitForFunction(() => !document.querySelector('#dlPng').disabled);
    await page.locator('#clearData').click();
    assert.equal(await page.locator('[data-k="password"]').inputValue(),'');
    assert(await png.isDisabled());
    for (const name of ['Website','Text','WiFi','vCard','Business','Video','Images','Facebook','Instagram','Social Media','WhatsApp','MP3','Apps','Menu','Coupon','List of Links','Email','Phone','SMS']) {
      await page.getByRole('button',{name,exact:true}).click();
      assert(await png.isDisabled(), 'Blank '+name+' must not export placeholder data');
    }
    assert.deepEqual(unexpected, []);
    console.log('PASS: exports, invalidation, scheme validation, password masking, clearing, all blank formats');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
