{{--
    A keretrendszer level-elrendezese sajat lableccel (#137): a jogi oldalak
    linkjei minden kimeno levelben szerepelnek. A tobbi komponens (fejlec, gomb,
    stilus) a keretrendszer alapertelmezese marad.
--}}
<x-mail::layout>
{{-- Header --}}
<x-slot:header>
<x-mail::header :url="config('app.frontend_url')">
{{ config('app.name') }}
</x-mail::header>
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer --}}
<x-slot:footer>
<x-mail::footer>
© {{ date('Y') }} {{ config('app.name') }}

@foreach (config('legal.pages') as $label => $path)
[{{ $label }}]({{ config('app.frontend_url').$path }})@unless ($loop->last) · @endunless
@endforeach
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
