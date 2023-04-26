var Webflow = Webflow || [];
Webflow.push(function () {
  /*********************** GLOBAL VARIABLES *********************/
  const MAX_CHILDREN_HALF_SHARE_ADVANTAGE = 1678;
  const TAX_TRANCHES = [
    { max_amount_for_rate: 0, rate: 0 },
    { max_amount_for_rate: 10777, rate: 0 },
    { max_amount_for_rate: 27478, rate: 0.11 },
    { max_amount_for_rate: 78570, rate: 0.3 },
    { max_amount_for_rate: 168994, rate: 0.41 },
    { max_amount_for_rate: Number.POSITIVE_INFINITY, rate: 0.45 }
  ];
  const PASS = 43992;
  const MAX_DEDUCTION_EMPLOYEE_PROFESSIONAL_FEES = 13522;

  let MAX_DEDUCTIBLE_DEPOSIT;

  // Form Validation
  let form_validation_message;
  const MIN_VALUES = {
    revenu_imposable: 0,
    monthly_installements: 500
  };
  const MAX_VALUES = {
    revenu_imposable: 100000000000,
    monthly_installements: 100000000
  };
  const MESSAGE_REQUIREDEMPTY =
    "Ce champ est requis. Veuillez le remplir pour valider.";
  const DEFAULT_ERROR_MSG =
    "Veuillez corriger les champs en rouge sur les différentes étapes.";

  /**************  FUNCTIONS **************/
  ////// Form Field validation
  function form_field_badinput(field_elt, field_error_text, isbad) {
    const field_tip = field_elt.parentNode.querySelector(
      ".simulateur_field-text-error"
    );
    if (isbad) {
      field_elt.classList.add("is_error");
      if (field_tip != null) {
        field_tip.textContent = field_error_text;
        field_tip.style.color = "red";
        field_tip.style.display = "flex";
      }
    } else {
      field_elt.classList.remove("is_error");
      if (field_tip != null) {
        field_tip.textContent = "";
        field_tip.style.color = "black";
        field_tip.style.display = "none";
      }
    }
  }
  function isDigit(val) {
    return !isNaN(+val);
    // Checking if float
    //return Number(val) === val && val % 1 !== 0;
  }

  function check_digit_field_validity(
    field_elt,
    field_val,
    min_val_accepted,
    max_val_accepted,
    val_unit
  ) {
    if (field_val < min_val_accepted || field_val > max_val_accepted) {
      form_field_badinput(
        field_elt,
        "Ce champ doit être compris entre " +
          min_val_accepted +
          val_unit +
          " et " +
          max_val_accepted +
          val_unit +
          ".",
        true
      );
      return false;
    } else if (isDigit(field_val)) {
      field_elt.value = parseFloat(field_val);
      form_field_badinput(field_elt, "", false);
      return true;
    }
  }

  function form_field_validation(field_elt) {
    let field_val = field_elt.value;
    if (field_val === "" && field_elt.required) {
      form_field_badinput(field_elt, MESSAGE_REQUIREDEMPTY, true);
      return false;
    }
    switch (field_elt.name) {
      case "versement-per":
        return check_digit_field_validity(
          field_elt,
          field_val,
          MIN_VALUES.monthly_installements,
          MAX_VALUES.monthly_installements,
          "€"
        );
      case "revenus-imposables":
        return check_digit_field_validity(
          field_elt,
          field_val,
          MIN_VALUES.revenu_imposable,
          MAX_VALUES.revenu_imposable,
          "€"
        );
      default:
        form_field_badinput(field_elt, "Parfait !", false);
        return true;
    }
  }

  function form_field_auto_validation(field_elt) {
    field_elt.addEventListener("blur", () => {
      form_field_validation(field_elt);
    });
  }

  function form_main_error(isNotValid) {
    form_validation_message = DEFAULT_ERROR_MSG;
    let form_error_div = document
      .getElementsByClassName("form_error_div")
      .item(0);
    if (isNotValid) {
      form_error_div.style.display = "flex";
      form_error_div
        .getElementsByClassName("form_error_text")
        .item(0).textContent = form_validation_message;
    } else {
      form_error_div.style.display = "none";
    }
  }

  /**** FUNCTIONS COMPUTATION ******/
  function compute_raw_professional_income_tax(income, number_of_shares) {
    let income_per_share = income / number_of_shares;
    let income_tax = 0;
    for (let idx = 1; idx < TAX_TRANCHES.length; idx++) {
      let tranche_income =
        Math.min(income_per_share, TAX_TRANCHES[idx].max_amount_for_rate) -
        TAX_TRANCHES[idx - 1].max_amount_for_rate;
      income_tax += Math.max(tranche_income, 0) * TAX_TRANCHES[idx].rate;
    }
    return income_tax * number_of_shares;
  }

  function compute_real_professional_income_tax(
    income,
    number_adults,
    number_children
  ) {
    let children_shares =
      Math.min(number_children, 2) * 0.5 + Math.max(number_children - 2, 0) * 1;
    let total_shares = number_adults + children_shares;
    let adults_only_income_tax = compute_raw_professional_income_tax(
      income,
      number_adults
    );
    let all_family_income_tax = compute_raw_professional_income_tax(
      income,
      total_shares
    );
    let children_tax_advantage = adults_only_income_tax - all_family_income_tax;
    let max_children_tax_advantage =
      MAX_CHILDREN_HALF_SHARE_ADVANTAGE * children_shares * 2;
    let real_income_tax =
      adults_only_income_tax +
      Math.min(children_tax_advantage, max_children_tax_advantage);
    return real_income_tax;
  }

  function compute_PER_max_deductible_deposit_for_employee(
    net_yearly_household_revenue,
    number_adults
  ) {
    let net_revenue = net_yearly_household_revenue;
    let net_taxable_revenue = compute_net_taxable_revenue_for_employee(
      net_revenue,
      number_adults
    );
    MAX_DEDUCTIBLE_DEPOSIT =
      0.1 * Math.max(Math.min(net_taxable_revenue, 8 * PASS), PASS);
    return net_taxable_revenue;
  }

  function compute_net_taxable_revenue_for_employee(
    net_revenue,
    number_adults
  ) {
    return (
      net_revenue -
      Math.min(
        0.1 * net_revenue,
        MAX_DEDUCTION_EMPLOYEE_PROFESSIONAL_FEES * number_adults
      )
    );
  }

  function compute_PER_tax_advantage_given_amount(
    yearly_household_income,
    number_adults,
    number_children,
    subscription_amount
  ) {
    let net_taxable_revenue = compute_PER_max_deductible_deposit_for_employee(
      yearly_household_income,
      number_adults
    );
    let deductible_deposit = Math.min(
      MAX_DEDUCTIBLE_DEPOSIT,
      subscription_amount
    );
    let income_tax_with_PER = compute_real_professional_income_tax(
      net_taxable_revenue - deductible_deposit,
      number_adults,
      number_children
    );
    let income_tax_without_PER = compute_real_professional_income_tax(
      net_taxable_revenue,
      number_adults,
      number_children
    );
    let tax_advantage = income_tax_without_PER - income_tax_with_PER;
    return tax_advantage;
  }

  function format_result(number_val) {
    if (number_val % 1 === 0) {
      // Check if the number is an integer
      number_val = number_val.toFixed(0); // Remove decimal point and trailing zeros
    } else {
      number_val = number_val.toFixed(2);
    }
    number_val = String(number_val).replace(".", ","); // Replace '.' with ',' in the string
    return number_val.replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Add a space every 3 digits
  }
  /*********************** MAIN *********************/
  let yearly_household_income,
    number_adults,
    number_children,
    subscription_amount,
    per_tax_advantage;
  const simulation_form = document.querySelector(
    "form[form_name='simulateur']"
  );
  let yearly_household_income_field = simulation_form.querySelector(
    "input[name='revenus-imposables']"
  );
  let subscription_amount_field = simulation_form.querySelector(
    "input[name='versement-per']"
  );

  /************ Event listeners *************/
  simulation_form.querySelectorAll("input").forEach(function (input_elt) {
    form_field_auto_validation(input_elt);
  });

  // When user ask for submission
  simulation_form
    .querySelector('[simulation-form="false-submit-button"]')
    .addEventListener("click", function (event) {
      let form_validated = true;

      let number_children_field = simulation_form.querySelector(
        "input[name='foyer-fiscal']:checked"
      );
      let number_adults_field = simulation_form.querySelector(
        "input[name='nbre-declarants']:checked"
      );

      let text_inputs = [
        yearly_household_income_field,
        subscription_amount_field
      ];
      text_inputs.forEach(function (input_elt) {
        let isValidInput = form_field_validation(input_elt);
        if (!isValidInput) {
          form_validated = false;
        }
      });

      if (!form_validated) {
        form_main_error(true);
      } else {
        /// Form validation OK
        form_main_error(false);

        // Retrieving the values of the different inputs
        yearly_household_income = parseInt(
          yearly_household_income_field.value,
          10
        );
        number_adults = parseInt(number_adults_field.value, 10);
        number_children = parseInt(number_children_field.value, 10);
        subscription_amount = parseInt(subscription_amount_field.value, 10);

        // Computing the result of Tax advantage
        per_tax_advantage = compute_PER_tax_advantage_given_amount(
          yearly_household_income,
          number_adults,
          number_children,
          subscription_amount
        );

        per_tax_advantage = format_result(per_tax_advantage);

        // Changing the result text
        document.querySelector("[simulation_result]").textContent =
          per_tax_advantage + "€";

        // Submitting the form
        simulation_form.querySelector('input[type="submit"]').click();
        setTimeout(() => {
          document.querySelector("html").scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
          });
          //$("html").animate({ scrollTop: 0 }, 300);
        }, 500);

        /**/
      }
    });
  //End button click
  /*simulation_form
    .querySelector('input[type="submit"]')
    .addEventListener("submit", function (evt) {
      evt.preventDefault();
      document.querySelector("html").scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
     //$("html, body").animate({ scrollTop: 0 }, "slow");
      return true;
    });
    */
});
