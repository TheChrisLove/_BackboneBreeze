
/*

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Number },
    resetToken: { type: String }
});
*/

$data.Class.define("api.passport", $data.Entity, null, {
    _id: { type: "id", key: true, computed: true, nullable: false },
    username: { type: "string", nullable: false },
    password: { type: "string", nullable: false },
    loginAttempts: { type: "integer", nullable: false },
    lockUntil: { type: "integer" },
    resetToken: { type: "string" }
}, null);

$data.Class.defineEx("api.Context", [$data.EntityContext,$data.ServiceBase], null, {
    passports: { type: $data.EntitySet, elementType: api.passport }
});

exports = api.Context;