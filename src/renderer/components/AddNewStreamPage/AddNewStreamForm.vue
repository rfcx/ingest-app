<template>
    <fieldset>
        <div class="field">
            <label class="label">Name</label>
            <div class="control">
                <input class="input" type="text" placeholder="Jaguar 1">
            </div>
        </div>
        <label class="label">Folder path</label>
        <div class="field has-addons">
            <p class="control input-control">
                <input class="input" type="text" placeholder="/User/Documents/RFCx">
            </p>
            <p class="control">
                <a class="button">Browse</a>
            </p>
        </div>
        <div class="field">
            <label class="label">Timestamp format</label>
            <div class="control">
                <div class="select is-fullwidth">
                    <select>
                    <option>Auto-detect</option>
                    <option>yyyymmdd-hhMM</option>
                    <option>yyyymmddThh:MM:SS</option>
                    <option>Custom</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="field is-grouped">
            <p class="control">
                <router-link to="/"><a class="button is-light">Cancel</a></router-link>
            </p>
            <p class="control">
                <a class="button is-primary">Create</a>
            </p>
        </div>
    </fieldset>
</template>

<style>

    .has-addons .input-control {
        width: -webkit-fill-available;
    }

</style>
