import axios from "@/utils/axios";
let _stsToken = '';
let loading = false;
let deferredList = [];

export function getStsToken() {
  return async function () {
    let deferred = new Promise((resolve, reject) => {
      if (
        _stsToken &&
        _stsToken.Credentials &&
        _stsToken.Credentials.Expiration &&
        new Date(_stsToken.Credentials.Expiration).getTime() - new Date().getTime() > 1800000
      ) {
        resolve({
          token: _stsToken,
          refresh: false
        });
      } else {
        if (loading) {
          deferredList.push({ resolve, reject });
        } else {
          loading = true;
          axios.get('/oss/token')
            .then(function (stsToken) {
              _stsToken = stsToken;
              resolve({
                token: stsToken,
                refresh: true
              });
              while (deferredList.length) {
                let d = deferredList.pop();
                d.resolve({
                  token: stsToken,
                  refresh: true
                });
              }
            })
            .catch(function (err) {
              reject(err);
              while (deferredList.length) {
                let d = deferredList.pop();
                d.reject(err);
              }
            })
            .finally(function () {
              loading = false;
            });
        }
      }
    });

    return deferred;
  };
}
