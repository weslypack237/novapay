<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required_without:phone', 'nullable', 'email:rfc', 'max:255', 'unique:users,email'],
            // E.164, Cameroon numbers default to +237
            'phone' => ['required_without:email', 'nullable', 'regex:/^\+[1-9]\d{7,14}$/', 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::min(10)->letters()->mixedCase()->numbers()],
            'country_code' => ['nullable', 'string', 'size:2'],
            'accept_terms' => ['accepted'],
        ];
    }
}
