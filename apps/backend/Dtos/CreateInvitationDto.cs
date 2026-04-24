using System.ComponentModel.DataAnnotations;

namespace MitigramApi.Dtos;

public class CreateInvitationDto
{
    [Required]
    [MinLength(1, ErrorMessage = "emails must not be empty")]
    [EachEmail]
    public string[] Emails { get; set; } = [];
}

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public sealed class EachEmailAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext ctx)
    {
        if (value is not string[] emails) return ValidationResult.Success;
        var attr = new EmailAddressAttribute();
        var bad = emails.Where(e => !attr.IsValid(e)).ToArray();
        return bad.Length == 0
            ? ValidationResult.Success
            : new ValidationResult($"Invalid email address(es): {string.Join(", ", bad)}");
    }
}
